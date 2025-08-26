import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ProfileType } from '@/components/profile/types';

interface UseOptimizedAdminUsersProps {
  search: string;
  status: string;
  userType: string;
  optStatus: string;
  ratingFrom: string;
  ratingTo: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  currentPage: number;
  pageSize: number;
}

export const useOptimizedAdminUsers = (filters: UseOptimizedAdminUsersProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  return useQuery({
    queryKey: ['admin', 'users-optimized', filters],
    queryFn: async () => {
      console.log('🔍 Executing optimized users search with new logic...');
      const startTime = performance.now();

      // Rate limiting check
      if (user?.id) {
        const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc('check_search_rate_limit', {
          p_user_id: user.id,
          p_search_type: 'admin_users'
        });

        if (rateLimitError || !rateLimitOk) {
          throw new Error('Слишком много поисковых запросов. Попробуйте позже.');
        }
      }

      // Promise for main users query
      const usersPromise = (async () => {
        const selectFields = [
          'id', 'email', 'full_name', 'company_name', 'opt_id', 'phone', 'telegram', 'telegram_id',
          'user_type', 'verification_status', 'opt_status', 'rating', 'communication_ability',
          'created_at', 'avatar_url', 'location', 'is_trusted_seller', 'preferred_locale'
        ].join(', ');

        let query = supabase
          .from('profiles')
          .select(selectFields, { count: 'exact' });

        // Применяем фильтры
        if (filters.status !== 'all') {
          query = query.eq('verification_status', filters.status);
        }

        if (filters.userType !== 'all') {
          query = query.eq('user_type', filters.userType);
        }

        if (filters.optStatus !== 'all') {
          query = query.eq('opt_status', filters.optStatus);
        }

        // Улучшенный поиск по нескольким полям
        if (filters.search) {
          const searchTerm = `%${filters.search.trim().replace(/ +/g, '%')}%`;
          console.log(`[AdminUsers] Searching for: "${searchTerm}"`);
          query = query.or(
            `full_name.ilike.${searchTerm},` +
            `company_name.ilike.${searchTerm},` +
            `email.ilike.${searchTerm},` +
            `opt_id.ilike.${searchTerm},` +
            `phone.ilike.${searchTerm},` +
            `telegram.ilike.${searchTerm}`
          );
        }

        // Фильтры по рейтингу
        if (filters.ratingFrom) {
          query = query.gte('rating', parseFloat(filters.ratingFrom));
        }
        if (filters.ratingTo) {
          query = query.lte('rating', parseFloat(filters.ratingTo));
        }

        // Фильтры по датам
        if (filters.dateFrom) {
          query = query.gte('created_at', filters.dateFrom.toISOString());
        }
        if (filters.dateTo) {
          const dateTo = new Date(filters.dateTo);
          dateTo.setHours(23, 59, 59, 999);
          query = query.lte('created_at', dateTo.toISOString());
        }

        // Пагинация и сортировка
        const from = (filters.currentPage - 1) * filters.pageSize;
        const to = from + filters.pageSize - 1;

        const { data, count, error } = await query
          .order(filters.sortField, { ascending: filters.sortDirection === 'asc' })
          .range(from, to);

        if (error) {
          console.error('❌ Users query error:', error);
          throw error;
        }

        return { data, count };
      })();

      // Promise for pending users count
      const pendingCountPromise = (async () => {
        const { count, error } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('verification_status', 'pending');
        
        if (error) {
          console.error('❌ Pending users count query error:', error);
          // Don't throw, just return 0 to not fail the whole page
          return 0;
        }
        return count;
      })();
      
      const [usersResult, pendingUsersCount] = await Promise.all([
        usersPromise,
        pendingCountPromise
      ]);

      const endTime = performance.now();
      console.log(`✅ Users query with new logic completed in ${(endTime - startTime).toFixed(2)}ms. Found ${usersResult.count} users.`);

      return {
        users: usersResult.data as ProfileType[],
        totalCount: usersResult.count || 0,
        totalPages: Math.ceil((usersResult.count || 0) / filters.pageSize),
        pendingUsersCount: pendingUsersCount || 0
      };
    },
    staleTime: 5 * 60 * 1000, // 5 минут для админских данных
    gcTime: 10 * 60 * 1000, // 10 минут в памяти
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Не повторяем запросы при rate limiting
      if (error.message.includes('поисковых запросов')) {
        return false;
      }
      return failureCount < 2;
    },
    meta: {
      onError: (error: Error) => {
        console.error('❌ Admin users query error:', error);
        toast({
          title: "Ошибка загрузки пользователей",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  });
};
