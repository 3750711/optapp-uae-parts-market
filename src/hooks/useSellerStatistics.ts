import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export interface SellerStatistic {
  seller_id: string;
  seller_name: string;
  seller_opt_id: string | null;
  products_created: number;
  orders_created: number;
  total_revenue: number;
  avg_order_value: number;
}

interface UseSellerStatisticsParams {
  startDate?: Date;
  endDate?: Date;
  enabled?: boolean;
}

export const useSellerStatistics = ({
  startDate = subDays(new Date(), 30),
  endDate = new Date(),
  enabled = true
}: UseSellerStatisticsParams = {}) => {
  return useQuery({
    queryKey: ['seller-daily-statistics', startDate, endDate],
    queryFn: async (): Promise<SellerStatistic[]> => {
      const { data, error } = await supabase.rpc('get_seller_daily_statistics', {
        start_date: startOfDay(startDate).toISOString().split('T')[0],
        end_date: endOfDay(endDate).toISOString().split('T')[0]
      });

      if (error) {
        console.error('Error fetching seller statistics:', error);
        throw error;
      }

      // Calculate avg_order_value for each seller
      const processedData = (data || []).map((item: any) => ({
        ...item,
        avg_order_value: item.orders_created > 0 ? item.total_revenue / item.orders_created : 0
      }));

      return processedData;
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};