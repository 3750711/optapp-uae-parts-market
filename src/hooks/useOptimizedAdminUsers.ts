
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
      console.log('🔍 Executing optimized users search...');
      const startTime = performance.now();

      // Rate limiting check
      if (user?.id) {
        const rateLimitOk = await supabase.rpc('check_search_rate_limit', {
          p_user_id: user.id,
          p_search_type: 'admin_users'
        });

        if (!rateLimitOk) {
          throw new Error('Слишком много поисковых запросов. Попробуйте позже.');
        }
      }

      // Выбираем только необходимые поля
      const selectFields = [
        'id', 'email', 'full_name', 'company_name', 'opt_id', 'phone', 'telegram',
        'user_type', 'verification_status', 'opt_status', 'rating', 'communication_ability',
        'created_at', 'avatar_url', 'location'
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

      // Оптимизированный поиск
      if (filters.search && filters.search.length >= 2) {
        const searchTerm = filters.search.trim();
        
        if (searchTerm.length >= 3) {
          // Используем полнотекстовый поиск для длинных запросов
          query = query.textSearch('fts', `'${searchTerm}':*`, {
            type: 'websearch',
            config: 'russian'
          });
        } else {
          // Fallback для коротких запросов
          query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,opt_id.ilike.%${searchTerm}%`);
        }
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

      const endTime = performance.now();
      console.log(`✅ Users query completed in ${(endTime - startTime).toFixed(2)}ms`);

      return {
        users: data as ProfileType[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / filters.pageSize)
      };
    },
    staleTime: 2 * 60 * 1000, // Уменьшено до 2 минут для более актуальных данных
    gcTime: 5 * 60 * 1000, // 5 минут в памяти
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
