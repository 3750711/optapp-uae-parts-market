import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { ProfileType } from '@/components/profile/types';

interface OptimizedProfileData {
  profile: ProfileType | null;
  orderStats: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
  } | null;
  storeInfo: {
    id: string;
    name: string;
    description: string | null;
    verified: boolean;
  } | null;
}

export const useOptimizedProfile = () => {
  const { user, profile, isLoading: authLoading } = useAuth();

  const { 
    data, 
    isLoading: queryLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['optimized-profile', user?.id],
    queryFn: async (): Promise<OptimizedProfileData> => {
      console.log('useOptimizedProfile: Starting query for user:', user?.id);
      console.log('useOptimizedProfile: Profile state:', profile);
      
      if (!user?.id || !profile) {
        console.error('useOptimizedProfile: User not authenticated', { userId: user?.id, profile });
        throw new Error('User not authenticated');
      }

      const isSeller = profile.user_type === 'seller';
      console.log('useOptimizedProfile: User is seller:', isSeller);

      try {
        // Параллельно выполняем все запросы
        const [orderStatsData, storeData] = await Promise.all([
          // Статистика заказов
          Promise.all([
            supabase
              .from('orders')
              .select('status, created_at')
              .eq('buyer_id', profile.id),
            
            isSeller ? supabase
              .from('orders')
              .select('status, created_at')
              .eq('seller_id', profile.id) : Promise.resolve({ data: [], error: null })
          ]),
          
          // Информация о магазине (только для продавцов)
          isSeller ? supabase
            .from('stores')
            .select('id, name, description, verified')
            .eq('seller_id', user.id)
            .maybeSingle() : Promise.resolve({ data: null, error: null })
        ]);

        // Обработка статистики заказов
        const [buyerOrdersResult, sellerOrdersResult] = orderStatsData;
        
        if (buyerOrdersResult.error) {
          console.error('useOptimizedProfile: Buyer orders error:', buyerOrdersResult.error);
          throw buyerOrdersResult.error;
        }
        if (sellerOrdersResult.error) {
          console.error('useOptimizedProfile: Seller orders error:', sellerOrdersResult.error);
          throw sellerOrdersResult.error;
        }

        const buyerOrders = buyerOrdersResult.data || [];
        const sellerOrders = sellerOrdersResult.data || [];
        const allOrders = [...buyerOrders, ...sellerOrders];

        const orderStats = {
          totalOrders: allOrders.length,
          completedOrders: allOrders.filter(o => o.status === 'completed').length,
          pendingOrders: allOrders.filter(o => ['created', 'confirmed'].includes(o.status)).length
        };

        console.log('useOptimizedProfile: Order stats calculated:', orderStats);

        // Обработка данных магазина
        if (storeData.error) {
          console.error('useOptimizedProfile: Store data error:', storeData.error);
          throw storeData.error;
        }

        console.log('useOptimizedProfile: Store data:', storeData.data);

        const result = {
          profile,
          orderStats,
          storeInfo: storeData.data
        };

        console.log('useOptimizedProfile: Query completed successfully:', result);
        return result;
      } catch (error) {
        console.error('useOptimizedProfile: Query failed:', error);
        throw error;
      }
    },
    enabled: !!user?.id && !!profile && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 минут
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Возвращаем isLoading как true если либо auth загружается, либо query загружается
  const isLoading = authLoading || queryLoading;

  return {
    data: data || { profile, orderStats: null, storeInfo: null },
    isLoading,
    error,
    refetch,
    profile: data?.profile || profile,
    orderStats: data?.orderStats,
    storeInfo: data?.storeInfo
  };
};
