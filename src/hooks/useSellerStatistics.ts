import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export interface SellerStatistic {
  date: string;
  seller_id: string;
  seller_name: string;
  opt_id: string | null;
  products_created: number;
  orders_created: number;
  total_order_value: number;
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
        p_start_date: startOfDay(startDate).toISOString().split('T')[0],
        p_end_date: endOfDay(endDate).toISOString().split('T')[0]
      });

      if (error) {
        console.error('Error fetching seller statistics:', error);
        throw error;
      }

      return data || [];
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};