import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrderStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
}

/**
 * Hook to fetch order statistics for a user
 * Counts orders where user is buyer OR seller
 */
export function useOrderStats(userId?: string, userType?: string) {
  return useQuery({
    queryKey: ['order-stats', userId],
    queryFn: async (): Promise<OrderStats> => {
      if (!userId) {
        return { totalOrders: 0, completedOrders: 0, pendingOrders: 0 };
      }

      const isSeller = userType === 'seller';

      // Fetch orders as buyer
      const buyerOrdersPromise = supabase
        .from('orders')
        .select('status, created_at')
        .eq('buyer_id', userId);

      // Fetch orders as seller (if user is seller)
      const sellerOrdersPromise = isSeller
        ? supabase
            .from('orders')
            .select('status, created_at')
            .eq('seller_id', userId)
        : Promise.resolve({ data: [], error: null });

      const [buyerOrdersData, sellerOrdersData] = await Promise.all([
        buyerOrdersPromise,
        sellerOrdersPromise,
      ]);

      if (buyerOrdersData.error) throw buyerOrdersData.error;
      if (sellerOrdersData.error) throw sellerOrdersData.error;

      const buyerOrders = buyerOrdersData.data || [];
      const sellerOrders = sellerOrdersData.data || [];
      const allOrders = [...buyerOrders, ...sellerOrders];

      return {
        totalOrders: allOrders.length,
        completedOrders: allOrders.filter((o) => o.status === 'completed').length,
        pendingOrders: allOrders.filter((o) => ['created', 'confirmed'].includes(o.status)).length,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}
