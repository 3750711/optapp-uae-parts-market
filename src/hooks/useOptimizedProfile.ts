
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OptimizedProfileData {
  profile: any;
  orderStats: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
  };
  storeInfo: any;
}

export const useOptimizedProfile = () => {
  const { user, profile } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['optimized-profile', user?.id, profile?.email], // Добавляем email в ключ кэша
    queryFn: async (): Promise<OptimizedProfileData> => {
      if (!user?.id) {
        throw new Error('No user ID available');
      }

      // Fetch order stats
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('status')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      }

      const orderStats = {
        totalOrders: orders?.length || 0,
        completedOrders: orders?.filter(o => o.status === 'completed').length || 0,
        pendingOrders: orders?.filter(o => o.status === 'pending').length || 0,
      };

      // Fetch store info if user is seller
      let storeInfo = null;
      if (profile?.user_type === 'seller') {
        const { data: store, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('seller_id', user.id)
          .single();

        if (storeError && storeError.code !== 'PGRST116') {
          console.error('Error fetching store:', storeError);
        } else {
          storeInfo = store;
        }
      }

      return {
        profile,
        orderStats,
        storeInfo
      };
    },
    enabled: !!user?.id && !!profile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    data,
    isLoading,
    error,
    refetch,
    profile: data?.profile || profile,
    orderStats: data?.orderStats || { totalOrders: 0, completedOrders: 0, pendingOrders: 0 },
    storeInfo: data?.storeInfo || null
  };
};
