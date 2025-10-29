import { useMemo } from 'react';
import { LogisticsFilters, FilterStats } from '@/types/logisticsFilters';
import { OrderShipmentSummary } from '@/hooks/useBatchOrderShipmentSummary';

interface Order {
  id: string;
  order_number: number;
  title: string;
  seller_id: string;
  buyer_id: string;
  status: string;
  delivery_price_confirm: number | null;
  [key: string]: any;
}

export const useFilteredOrders = (
  orders: Order[],
  filters: LogisticsFilters,
  shipmentSummaries: Map<string, OrderShipmentSummary>
) => {
  return useMemo(() => {
    let filtered = [...orders];

    // 1. Текстовый поиск (по номеру заказа или названию товара)
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order => 
        order.order_number.toString().includes(term) ||
        order.title.toLowerCase().includes(term)
      );
    }

    // 2. Фильтр по продавцам (OR логика внутри, AND между фильтрами)
    if (filters.sellerIds.length > 0) {
      filtered = filtered.filter(order => 
        filters.sellerIds.includes(order.seller_id)
      );
    }

    // 3. Фильтр по покупателям
    if (filters.buyerIds.length > 0) {
      filtered = filtered.filter(order => 
        filters.buyerIds.includes(order.buyer_id)
      );
    }

    // 4. Фильтр по статусам отгрузки (из shipmentSummaries)
    if (filters.shipmentStatuses.length > 0) {
      filtered = filtered.filter(order => {
        const summary = shipmentSummaries.get(order.id);
        if (!summary) return false;
        return filters.shipmentStatuses.includes(summary.calculated_status);
      });
    }

    // 5. Фильтр по контейнерам
    if (filters.containerNumbers.length > 0) {
      filtered = filtered.filter(order => {
        const summary = shipmentSummaries.get(order.id);
        if (!summary?.containers_info) return false;
        
        // Проверяем, есть ли хотя бы один из выбранных контейнеров в заказе
        return summary.containers_info.some(container => 
          filters.containerNumbers.includes(container.containerNumber)
        );
      });
    }

    // 6. Фильтр по статусам контейнеров
    if (filters.containerStatuses.length > 0) {
      filtered = filtered.filter(order => {
        const summary = shipmentSummaries.get(order.id);
        if (!summary?.containers_info) return false;
        
        // Проверяем статусы контейнеров заказа
        return summary.containers_info.some(container => 
          filters.containerStatuses.includes(container.status as any)
        );
      });
    }

    // 7. Фильтр по статусам заказа
    if (filters.orderStatuses.length > 0) {
      filtered = filtered.filter(order => 
        filters.orderStatuses.includes(order.status as any)
      );
    }

    // 8. Вычисляем статистику
    const stats: FilterStats = {
      totalOrders: orders.length,
      filteredOrders: filtered.length,
      notShipped: 0,
      partiallyShipped: 0,
      inTransit: 0,
      totalDeliveryPrice: 0
    };

    filtered.forEach(order => {
      const summary = shipmentSummaries.get(order.id);
      if (summary) {
        if (summary.calculated_status === 'not_shipped') stats.notShipped++;
        else if (summary.calculated_status === 'partially_shipped') stats.partiallyShipped++;
        else if (summary.calculated_status === 'in_transit') stats.inTransit++;
      }
      stats.totalDeliveryPrice += Number(order.delivery_price_confirm || 0);
    });

    return { filteredOrders: filtered, stats };
  }, [orders, filters, shipmentSummaries]);
};
