
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user, profile } = useAuth();

  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['optimized-profile', user?.id],
    queryFn: async (): Promise<OptimizedProfileData> => {
      if (!user?.id || !profile) {
        throw new Error('User not authenticated');
      }

      const isSeller = profile.user_type === 'seller';

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
      
      if (buyerOrdersResult.error) throw buyerOrdersResult.error;
      if (sellerOrdersResult.error) throw sellerOrdersResult.error;

      const buyerOrders = buyerOrdersResult.data || [];
      const sellerOrders = sellerOrdersResult.data || [];
      const allOrders = [...buyerOrders, ...sellerOrders];

      const orderStats = {
        totalOrders: allOrders.length,
        completedOrders: allOrders.filter(o => o.status === 'completed').length,
        pendingOrders: allOrders.filter(o => ['created', 'confirmed'].includes(o.status)).length
      };

      // Обработка данных магазина
      if (storeData.error) throw storeData.error;

      return {
        profile,
        orderStats,
        storeInfo: storeData.data
      };
    },
    enabled: !!user?.id && !!profile,
    staleTime: 5 * 60 * 1000, // 5 минут
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

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
