import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OrderShipmentSummary {
  totalPlaces: number;
  shippedPlaces: number;
  notShippedPlaces: number;
  calculatedStatus: 'not_shipped' | 'partially_shipped' | 'in_transit';
  containerInfo: Array<{
    containerNumber: string | null;
    placesCount: number;
    status: 'not_shipped' | 'in_transit';
  }>;
}

export const useOrderShipmentSummary = (orderId: string) => {
  return useQuery({
    queryKey: ['order-shipment-summary', orderId],
    queryFn: async (): Promise<OrderShipmentSummary> => {
      const { data: shipments, error } = await supabase
        .from('order_shipments')
        .select('*')
        .eq('order_id', orderId)
        .order('place_number');

      if (error) throw error;

      if (!shipments || shipments.length === 0) {
        return {
          totalPlaces: 0,
          shippedPlaces: 0,
          notShippedPlaces: 0,
          calculatedStatus: 'not_shipped' as const,
          containerInfo: []
        };
      }

      const totalPlaces = shipments.length;
      const shippedPlaces = shipments.filter(s => s.shipment_status === 'in_transit').length;
      const notShippedPlaces = totalPlaces - shippedPlaces;

      // Group by container
      const containerMap = new Map<string, { placesCount: number; allShipped: boolean; anyShipped: boolean }>();
      
      shipments.forEach(shipment => {
        const containerKey = shipment.container_number || 'Не указан';
        const existing = containerMap.get(containerKey) || { placesCount: 0, allShipped: true, anyShipped: false };
        
        existing.placesCount += 1;
        
        if (shipment.shipment_status === 'in_transit') {
          existing.anyShipped = true;
        } else {
          existing.allShipped = false;
        }
        
        containerMap.set(containerKey, existing);
      });

      const containerInfo = Array.from(containerMap.entries()).map(([containerNumber, info]) => ({
        containerNumber: containerNumber === 'Не указан' ? null : containerNumber,
        placesCount: info.placesCount,
        status: info.allShipped ? 'in_transit' as const : 'not_shipped' as const
      }));

      // Calculate the real order status based on individual shipment statuses
      let calculatedStatus: 'not_shipped' | 'partially_shipped' | 'in_transit';
      if (shippedPlaces === 0) {
        calculatedStatus = 'not_shipped';
      } else if (shippedPlaces === totalPlaces) {
        calculatedStatus = 'in_transit';
      } else {
        calculatedStatus = 'partially_shipped';
      }

      return {
        totalPlaces,
        shippedPlaces,
        notShippedPlaces,
        calculatedStatus,
        containerInfo
      };
    },
    enabled: !!orderId,
  });
};