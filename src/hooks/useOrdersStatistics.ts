import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LogisticsFilters } from '@/types/logisticsFilters';

export interface OrdersStatistics {
  totalOrders: number;
  filteredOrders: number;
  notShipped: number;
  partiallyShipped: number;
  inTransit: number;
  totalDeliveryPrice: number;
}

export const useOrdersStatistics = (appliedFilters: LogisticsFilters) => {
  return useQuery({
    queryKey: ['orders-statistics', appliedFilters],
    queryFn: async () => {
      // 1. Получить все IDs заказов с учетом базовых фильтров
      let query = supabase
        .from('orders')
        .select('id, status, delivery_price_confirm');

      // Применяем базовые фильтры
      if (appliedFilters.searchTerm) {
        const term = appliedFilters.searchTerm;
        query = query.or(`order_number.ilike.%${term}%,title.ilike.%${term}%`);
      }

      if (appliedFilters.sellerIds.length > 0) {
        query = query.in('seller_id', appliedFilters.sellerIds);
      }

      if (appliedFilters.buyerIds.length > 0) {
        query = query.in('buyer_id', appliedFilters.buyerIds);
      }

      if (appliedFilters.orderStatuses.length > 0) {
        query = query.in('status', appliedFilters.orderStatuses);
      }

      // Применяем RPC фильтры
      let containerFilteredIds: string[] | null = null;
      if (appliedFilters.containerNumbers.length > 0) {
        const { data: orderIds, error } = await supabase
          .rpc('filter_orders_by_containers', { 
            container_numbers: appliedFilters.containerNumbers 
          });
        
        if (error) throw error;
        if (orderIds && orderIds.length > 0) {
          containerFilteredIds = orderIds.map(row => row.order_id);
        } else {
          return {
            totalOrders: 0,
            filteredOrders: 0,
            notShipped: 0,
            partiallyShipped: 0,
            inTransit: 0,
            totalDeliveryPrice: 0
          };
        }
      }

      let containerStatusFilteredIds: string[] | null = null;
      if (appliedFilters.containerStatuses.length > 0) {
        const { data: orderIds, error } = await supabase
          .rpc('filter_orders_by_container_statuses', { 
            container_statuses: appliedFilters.containerStatuses 
          });
        
        if (error) throw error;
        if (orderIds && orderIds.length > 0) {
          containerStatusFilteredIds = orderIds.map(row => row.order_id);
        } else {
          return {
            totalOrders: 0,
            filteredOrders: 0,
            notShipped: 0,
            partiallyShipped: 0,
            inTransit: 0,
            totalDeliveryPrice: 0
          };
        }
      }

      let shipmentStatusFilteredIds: string[] | null = null;
      if (appliedFilters.shipmentStatuses.length > 0) {
        const { data: orderIds, error } = await supabase
          .rpc('filter_orders_by_shipment_statuses', { 
            shipment_statuses: appliedFilters.shipmentStatuses 
          });
        
        if (error) throw error;
        if (orderIds && orderIds.length > 0) {
          shipmentStatusFilteredIds = orderIds.map(row => row.order_id);
        } else {
          return {
            totalOrders: 0,
            filteredOrders: 0,
            notShipped: 0,
            partiallyShipped: 0,
            inTransit: 0,
            totalDeliveryPrice: 0
          };
        }
      }

      // Применяем RPC фильтры через intersection
      const rpcFilteredIds = [
        containerFilteredIds,
        containerStatusFilteredIds,
        shipmentStatusFilteredIds
      ].filter(ids => ids !== null);

      if (rpcFilteredIds.length > 0) {
        const intersectedIds = rpcFilteredIds.reduce((acc, ids) => {
          if (acc === null) return ids;
          return acc!.filter(id => ids!.includes(id));
        }, null as string[] | null);

        if (intersectedIds && intersectedIds.length > 0) {
          query = query.in('id', intersectedIds);
        } else {
          return {
            totalOrders: 0,
            filteredOrders: 0,
            notShipped: 0,
            partiallyShipped: 0,
            inTransit: 0,
            totalDeliveryPrice: 0
          };
        }
      }

      const { data: orders, error } = await query;
      if (error) throw error;

      // 2. Получить статусы отгрузки для всех отфильтрованных заказов
      const orderIds = orders?.map(o => o.id) || [];
      
      if (orderIds.length === 0) {
        return {
          totalOrders: 0,
          filteredOrders: 0,
          notShipped: 0,
          partiallyShipped: 0,
          inTransit: 0,
          totalDeliveryPrice: 0
        };
      }

      const { data: shipmentStatuses, error: statusError } = await supabase
        .rpc('batch_calculate_shipment_status', { order_ids: orderIds });

      if (statusError) throw statusError;

      // 3. Вычислить статистику
      const statusMap = new Map(
        shipmentStatuses?.map(s => [s.order_id, s.status]) || []
      );

      const stats = {
        totalOrders: orders?.length || 0,
        filteredOrders: orders?.length || 0,
        notShipped: 0,
        partiallyShipped: 0,
        inTransit: 0,
        totalDeliveryPrice: 0
      };

      orders?.forEach(order => {
        const status = statusMap.get(order.id) || 'not_shipped';
        if (status === 'not_shipped') stats.notShipped++;
        if (status === 'partially_shipped') stats.partiallyShipped++;
        if (status === 'in_transit') stats.inTransit++;
        stats.totalDeliveryPrice += order.delivery_price_confirm || 0;
      });

      return stats;
    },
    enabled: true,
    staleTime: 30000 // 30 секунд
  });
};
