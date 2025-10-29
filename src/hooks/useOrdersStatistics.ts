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
      // 1. Получить общее количество всех заказов в БД
      const { count: totalCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // 2. Получить отфильтрованные заказы с увеличенным лимитом
      let query = supabase
        .from('orders')
        .select('id, status, delivery_price_confirm', { count: 'exact' })
        .limit(10000);

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

      // RPC фильтры (параллельно для производительности)
      const rpcCalls: Promise<string[] | null>[] = [];
      const emptyStats = {
        totalOrders: totalCount || 0,
        filteredOrders: 0,
        notShipped: 0,
        partiallyShipped: 0,
        inTransit: 0,
        totalDeliveryPrice: 0
      };

      // Добавляем RPC вызов для контейнеров
      if (appliedFilters.containerNumbers.length > 0) {
        rpcCalls.push(
          supabase.rpc('filter_orders_by_containers', { 
            container_numbers: appliedFilters.containerNumbers 
          }).then(({ data, error }) => {
            if (error) throw error;
            return data && data.length > 0 ? data.map(row => row.order_id) : [];
          })
        );
      }

      // Добавляем RPC вызов для статусов контейнеров
      if (appliedFilters.containerStatuses.length > 0) {
        rpcCalls.push(
          supabase.rpc('filter_orders_by_container_statuses', { 
            container_statuses: appliedFilters.containerStatuses 
          }).then(({ data, error }) => {
            if (error) throw error;
            return data && data.length > 0 ? data.map(row => row.order_id) : [];
          })
        );
      }

      // Добавляем RPC вызов для статусов отгрузки
      if (appliedFilters.shipmentStatuses.length > 0) {
        rpcCalls.push(
          supabase.rpc('filter_orders_by_shipment_statuses', { 
            shipment_statuses: appliedFilters.shipmentStatuses 
          }).then(({ data, error }) => {
            if (error) throw error;
            return data && data.length > 0 ? data.map(row => row.order_id) : [];
          })
        );
      }

      let containerFilteredIds: string[] | null = null;
      let containerStatusFilteredIds: string[] | null = null;
      let shipmentStatusFilteredIds: string[] | null = null;

      // Выполняем все RPC параллельно
      if (rpcCalls.length > 0) {
        const results = await Promise.all(rpcCalls);
        
        // Если хоть один вернул пустой массив - нет результатов
        if (results.some(r => r.length === 0)) {
          return emptyStats;
        }

        // Распределяем результаты по переменным
        let resultIndex = 0;
        if (appliedFilters.containerNumbers.length > 0) {
          containerFilteredIds = results[resultIndex++];
        }
        if (appliedFilters.containerStatuses.length > 0) {
          containerStatusFilteredIds = results[resultIndex++];
        }
        if (appliedFilters.shipmentStatuses.length > 0) {
          shipmentStatusFilteredIds = results[resultIndex++];
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
          return emptyStats;
        }
      }

      const { data: orders, count: filteredCount, error } = await query;
      if (error) throw error;

      // 2. Получить статусы отгрузки для всех отфильтрованных заказов
      const orderIds = orders?.map(o => o.id) || [];
      
      if (orderIds.length === 0) {
        return emptyStats;
      }

      const { data: shipmentStatuses, error: statusError } = await supabase
        .rpc('batch_calculate_shipment_status', { order_ids: orderIds });

      if (statusError) throw statusError;

      // 3. Вычислить статистику
      const statusMap = new Map(
        shipmentStatuses?.map(s => [s.order_id, s.status]) || []
      );

      const stats = {
        totalOrders: totalCount || 0,
        filteredOrders: filteredCount || 0,
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
