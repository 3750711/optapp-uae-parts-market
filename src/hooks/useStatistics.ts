import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Statistics {
  totalProducts: number;
  totalOrders: number;
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

      // Get total orders count
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Get unique sellers count
      const { count: totalSellers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'seller');

      return {
        totalProducts: totalProducts || 0,
        totalOrders: totalOrders || 0,
        totalSellers: totalSellers || 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};