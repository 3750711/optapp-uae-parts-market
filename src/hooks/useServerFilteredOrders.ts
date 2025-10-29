import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LogisticsFilters } from '@/types/logisticsFilters';
import { Database } from "@/integrations/supabase/types";

const ITEMS_PER_PAGE = 20;

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

type ContainerStatus = 'waiting' | 'sent_from_uae' | 'transit_iran' | 'to_kazakhstan' | 'customs' | 'cleared_customs' | 'received';

export type Order = Database['public']['Tables']['orders']['Row'] & {
  buyer: {
    full_name: string | null;
    location: string | null;
    opt_id: string | null;
  } | null;
  seller: {
    full_name: string | null;
    location: string | null;
    opt_id: string | null;
  } | null;
  containers: {
    status: ContainerStatus | null;
  }[] | null;
};

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
          seller:profiles!orders_seller_id_fkey (full_name, location, opt_id),
          containers(status)
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

      // 6-8. ФИЛЬТРЫ через RPC (параллельно)
      const rpcCalls: Promise<string[] | null>[] = [];

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
        
        // Если хоть один вернул пустой массив - нет пересечения
        if (results.some(r => r.length === 0)) {
          return { orders: [], totalCount: 0 };
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
