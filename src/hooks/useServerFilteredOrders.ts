import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LogisticsFilters } from '@/types/logisticsFilters';
import { Database } from "@/integrations/supabase/types";

const ITEMS_PER_PAGE = 20;

export type SortLevel = {
  field: string;
  direction: 'asc' | 'desc';
};

export interface SortConfig {
  levels: SortLevel[];
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
      console.log('🔍 [ServerFilter] Starting query with:', {
        pageParam,
        searchTerm: appliedFilters.searchTerm,
        hasSearch: !!appliedFilters.searchTerm.trim()
      });
      
      const from = pageParam * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      console.log('📍 [Pagination] Offset calculation:', {
        pageParam,
        ITEMS_PER_PAGE,
        from,
        to,
        willFetch: `orders[${from}...${to}]`
      });

      // 1. Базовый запрос
      let query = supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey (full_name, location, opt_id),
          seller:profiles!orders_seller_id_fkey (full_name, location, opt_id),
          containers(status)
        `, { count: 'exact' });

      // === 2. SEARCH TERM (по 5 полям + цена/номер заказа) ===
      if (appliedFilters.searchTerm.trim()) {
        // Убираем случайный минус в начале строки
        const term = appliedFilters.searchTerm.trim().replace(/^-+/, '');
        
        // Если после очистки строка пустая - пропускаем поиск
        if (!term) {
          console.log('⚠️ [Search] Empty term after cleanup, skipping');
          return { orders: [], totalCount: 0 };
        }
        
        const isNumeric = /^\d+(\.\d+)?$/.test(term);
        
        console.log('🔎 [Search Query]', {
          originalTerm: appliedFilters.searchTerm.trim(),
          cleanedTerm: term,
          isNumeric,
          willUseExactMatch: isNumeric
        });
        
        if (isNumeric) {
          if (term.includes('.')) {
            // Дробное число - точное совпадение по цене и стоимости доставки
            console.log('✅ [Search] Exact match for price/delivery:', term);
            query = query.or(`price.eq.${parseFloat(term)},delivery_price_confirm.eq.${parseFloat(term)}`.replace(/\s+/g, ''));
          } else {
            // Целое число - точное совпадение для всех числовых полей
            console.log('✅ [Search] Exact match for order/price/delivery:', term);
            const num = parseFloat(term);
            query = query.or(`order_number.eq.${parseInt(term)},price.eq.${num},delivery_price_confirm.eq.${num}`.replace(/\s+/g, ''));
          }
        } else {
          // ГИБРИДНЫЙ ПОИСК: с пробелами И без пробелов
          
          console.log('🔎 [Search] Hybrid search mode', {
            originalTerm: term,
            hasSpaces: term.includes(' ')
          });
          
          // 1️⃣ Базовый поиск С оригинальными пробелами
          let searchConditions = `title.ilike.%${term}%,brand.ilike.%${term}%,model.ilike.%${term}%,description.ilike.%${term}%,container_number.ilike.%${term}%`;

          // 2️⃣ Если есть пробелы, добавляем дополнительный поиск БЕЗ пробелов
          const termWithoutSpaces = term.replace(/\s+/g, '');
          if (termWithoutSpaces !== term) {
            console.log('📝 [Search] Adding no-space fallback:', termWithoutSpaces);
            searchConditions += `,title.ilike.%${termWithoutSpaces}%,brand.ilike.%${termWithoutSpaces}%,model.ilike.%${termWithoutSpaces}%,description.ilike.%${termWithoutSpaces}%,container_number.ilike.%${termWithoutSpaces}%`;
          }

          // 3️⃣ Если есть числовая часть, добавляем поиск по числовым полям
          const numericPart = term.match(/\d+(\.\d+)?/)?.[0];
          if (numericPart) {
            const numValue = parseFloat(numericPart);
            const intValue = parseInt(numericPart, 10);
            console.log('🔢 [Search] Adding numeric search:', { intValue, numValue });
            searchConditions += `,order_number.eq.${intValue},price.eq.${numValue},delivery_price_confirm.eq.${numValue}`;
          }

          // Передаём без дополнительной обработки
          query = query.or(searchConditions);
        }
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

      // 6. ФИЛЬТР: Готовность к отправке
      if (appliedFilters.readyForShipment !== null && appliedFilters.readyForShipment !== undefined) {
        query = query.eq('ready_for_shipment', appliedFilters.readyForShipment);
      }

      // 7-9. ФИЛЬТРЫ через RPC (параллельно)
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

      // 9. Сортировка (многоуровневая)
      if (sortConfig.levels && sortConfig.levels.length > 0) {
        // Применяем все уровни сортировки последовательно (Excel-стандарт)
        sortConfig.levels.forEach(level => {
          query = query.order(level.field, { ascending: level.direction === 'asc' });
        });
      } else {
        // По умолчанию: сначала по дате создания, потом по номеру заказа
        query = query.order('created_at', { ascending: false });
        query = query.order('order_number', { ascending: true });
      }

      // 10. Пагинация
      const { data: orders, error, count } = await query.range(from, to);

      if (error) throw error;

      console.log('✅ [ServerFilter] Query completed:', {
        ordersCount: orders?.length || 0,
        totalCount: count,
        searchTerm: appliedFilters.searchTerm
      });
      
      return {
        orders: orders as Order[],
        totalCount: count || 0
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalCount = lastPage?.totalCount || 0;
      const loadedOrders = allPages.reduce((acc, page) => acc + (page.orders?.length || 0), 0);
      
      // Простое правило: если загружено >= всего, больше страниц нет
      const hasMore = totalCount > 0 && loadedOrders < totalCount;
      const nextPageParam = hasMore ? allPages.length : undefined;
      
      console.log('🔄 [Pagination] getNextPageParam:', {
        loadedOrders,
        totalCount,
        currentPages: allPages.length,
        hasMore,
        nextPageParam,
        calculation: hasMore ? `${allPages.length} × 20 = ${allPages.length * 20} offset` : 'no more pages'
      });
      
      return nextPageParam;
    },
    initialPageParam: 0,
    staleTime: 30000, // 30 секунд
    gcTime: 5 * 60 * 1000, // 5 минут
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    maxPages: 100 // Максимум 2000 заказов (100 страниц × 20 товаров)
  });
};
