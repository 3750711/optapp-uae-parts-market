
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCachedAdminRights, setCachedAdminRights } from '@/utils/performanceUtils';

export const useOptimizedAdminAccess = (userId?: string) => {
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const { data: adminStatus, isLoading, error } = useQuery({
    queryKey: ['admin-access', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('No user ID provided');
      }

      console.log('🔐 Checking admin access for user:', userId);

      // Сначала проверяем кэш
      const cachedAccess = getCachedAdminRights(userId);
      if (cachedAccess !== null) {
        console.log('✅ Using cached admin access:', cachedAccess);
        return cachedAccess;
      }

      // Если кэша нет, делаем запрос к БД
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Error fetching user profile:', profileError);
        throw new Error('Ошибка при проверке прав доступа');
      }

      const isAdmin = profile?.user_type === 'admin';
      
      // Кэшируем результат
      setCachedAdminRights(userId, isAdmin);
      
      console.log(isAdmin ? '✅ Admin access confirmed' : '❌ Admin access denied');
      return isAdmin;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 минут кэш
    gcTime: 1000 * 60 * 30, // 30 минут в памяти
    retry: 1,
  });

  useEffect(() => {
    if (!isLoading) {
      setIsInitializing(false);
      
      if (error) {
        const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка при проверке прав доступа';
        setInitializationError(errorMessage);
      } else if (adminStatus !== undefined) {
        setHasAdminAccess(adminStatus);
        if (!adminStatus) {
          setInitializationError('Недостаточно прав для доступа к этой странице');
        }
      }
    }
  }, [isLoading, error, adminStatus]);

  return {
    hasAdminAccess,
    isInitializing,
    initializationError
  };
};
