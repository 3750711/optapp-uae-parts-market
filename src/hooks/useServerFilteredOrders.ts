import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LogisticsFilters } from '@/types/logisticsFilters';

const ITEMS_PER_PAGE = 20;

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface Order {
  id: string;
  order_number: string;
  title: string;
  seller_id: string;
  buyer_id: string;
  status: string;
  delivery_price_confirm: number | null;
  created_at: string;
  buyer?: {
    full_name: string;
    location: string;
    opt_id: string;
  };
  seller?: {
    full_name: string;
    location: string;
    opt_id: string;
  };
}

export const useServerFilteredOrders = (
  appliedFilters: LogisticsFilters,
  sortConfig: SortConfig
) => {
  return useInfiniteQuery({
    queryKey: ['logistics-orders-filtered', appliedFilters, sortConfig],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // 1. Базовый запрос
      let query = supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey (full_name, location, opt_id),
          seller:profiles!orders_seller_id_fkey (full_name, location, opt_id)
        `, { count: 'exact' });

      // 2. ФИЛЬТР: Текстовый поиск
      if (appliedFilters.searchTerm) {
        const term = appliedFilters.searchTerm;
        query = query.or(`order_number.ilike.%${term}%,title.ilike.%${term}%`);
      }

      // 3. ФИЛЬТР: Продавцы
      if (appliedFilters.sellerIds.length > 0) {
        query = query.in('seller_id', appliedFilters.sellerIds);
      }

      // 4. ФИЛЬТР: Покупатели
      if (appliedFilters.buyerIds.length > 0) {
        query = query.in('buyer_id', appliedFilters.buyerIds);
      }

      // 5. ФИЛЬТР: Статусы заказа
      if (appliedFilters.orderStatuses.length > 0) {
        query = query.in('status', appliedFilters.orderStatuses);
      }

      // 6. ФИЛЬТР: Контейнеры (через RPC)
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
          // Если нет заказов с такими контейнерами - возвращаем пустой результат
          return { orders: [], totalCount: 0 };
        }
      }

      // 7. ФИЛЬТР: Статусы контейнеров (через RPC)
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
          return { orders: [], totalCount: 0 };
        }
      }

      // 8. ФИЛЬТР: Статусы отгрузки (через RPC)
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
          return { orders: [], totalCount: 0 };
        }
      }

      // Применяем RPC фильтры через intersection (AND логика)
      const rpcFilteredIds = [
        containerFilteredIds,
        containerStatusFilteredIds,
        shipmentStatusFilteredIds
      ].filter(ids => ids !== null);

      if (rpcFilteredIds.length > 0) {
        // Находим пересечение всех массивов (AND логика)
        const intersectedIds = rpcFilteredIds.reduce((acc, ids) => {
          if (acc === null) return ids;
          return acc!.filter(id => ids!.includes(id));
        }, null as string[] | null);

        if (intersectedIds && intersectedIds.length > 0) {
          query = query.in('id', intersectedIds);
        } else {
          return { orders: [], totalCount: 0 };
        }
      }

      // 9. Сортировка
      if (sortConfig.field && sortConfig.direction) {
        query = query.order(sortConfig.field, { ascending: sortConfig.direction === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // 10. Пагинация
      const { data: orders, error, count } = await query.range(from, to);

      if (error) throw error;
      
      return {
        orders: orders as Order[],
        totalCount: count || 0
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.orders.length === ITEMS_PER_PAGE ? allPages.length : undefined;
    },
    initialPageParam: 0,
    staleTime: 30000, // 30 секунд
    gcTime: 5 * 60 * 1000, // 5 минут
  });
};
