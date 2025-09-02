import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Statistics {
  totalProducts: number;
  lastOrderNumber: number;
  totalSellers: number;
}

export const useStatistics = () => {
  return useQuery({
    queryKey: ['statistics'],
    queryFn: async (): Promise<Statistics> => {
      // Get total products count
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Get last order number
      const { data: lastOrder } = await supabase
        .from('orders')
        .select('order_number')
        .order('order_number', { ascending: false })
        .limit(1)
        .single();

      // Get unique sellers count
      const { count: totalSellers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'seller');

      return {
        totalProducts: totalProducts || 0,
        lastOrderNumber: lastOrder?.order_number || 0,
        totalSellers: totalSellers || 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};