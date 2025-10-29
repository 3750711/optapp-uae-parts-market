import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrderShipmentSummary {
  order_id: string;
  total_places: number;
  shipped_places: number;
  calculated_status: 'not_shipped' | 'partially_shipped' | 'in_transit';
  containers_info: Array<{
    containerNumber: string;
    placesCount: number;
    status: string;
  }> | null;
}

interface UseBatchOrderShipmentSummaryParams {
  orderIds: string[];
  enabled?: boolean;
}

export const useBatchOrderShipmentSummary = ({
  orderIds,
  enabled = true
}: UseBatchOrderShipmentSummaryParams) => {
  return useQuery({
    queryKey: ['batch-order-shipment-summary', orderIds],
    queryFn: async () => {
      if (orderIds.length === 0) {
        return new Map<string, OrderShipmentSummary>();
      }

      const { data, error } = await supabase
        .rpc('get_orders_shipment_summary', {
          order_ids: orderIds
        });

      if (error) {
        console.error('Error fetching batch shipment summary:', error);
        throw error;
      }

      // Convert array to Map for O(1) lookups
      const summaryMap = new Map<string, OrderShipmentSummary>();
      
      if (data) {
        data.forEach((item: any) => {
          summaryMap.set(item.order_id, {
            order_id: item.order_id,
            total_places: item.total_places,
            shipped_places: item.shipped_places,
            calculated_status: item.calculated_status,
            containers_info: item.containers_info
          });
        });
      }

      return summaryMap;
    },
    enabled: enabled && orderIds.length > 0,
    staleTime: 30000, // 30 seconds
    gcTime: 60000, // 1 minute
  });
};
