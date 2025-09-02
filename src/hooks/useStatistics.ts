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
      try {
        // Get total products count
        const { count: totalProducts } = await supabase
          .from('products')
          .select('*', { count: 'planned', head: true });

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
          .select('*', { count: 'planned', head: true })
          .eq('user_type', 'seller');

        const result = {
          totalProducts: totalProducts || 0,
          lastOrderNumber: lastOrder?.order_number || 0,
          totalSellers: totalSellers || 0,
        };
        
        // Cache successful results
        localStorage.setItem('statistics_cache', JSON.stringify(result));
        return result;
      } catch (error) {
        console.warn('Statistics fetch failed:', error);
        // Return cached data on error
        const cached = localStorage.getItem('statistics_cache');
        return cached ? JSON.parse(cached) : {
          totalProducts: 0,
          lastOrderNumber: 0,  
          totalSellers: 0,
        };
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error: any) => {
      return /TypeError|NetworkError|timeout|Failed to fetch/i.test(error?.message || '') && failureCount < 2;
    },
    placeholderData: () => {
      const cached = localStorage.getItem('statistics_cache');
      return cached ? JSON.parse(cached) : {
        totalProducts: 0,
        lastOrderNumber: 0,
        totalSellers: 0,
      };
    },
  });
};