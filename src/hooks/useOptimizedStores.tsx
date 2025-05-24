
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StoreWithImages } from '@/types/store';

interface OptimizedStoreData extends StoreWithImages {
  product_count: number;
}

export interface StoresFilters {
  verified?: boolean;
  minRating?: number;
  minProductCount?: number;
  tags?: string[];
  location?: string;
}

interface UseOptimizedStoresOptions {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  sortBy?: 'created_at' | 'rating' | 'product_count' | 'name';
  sortOrder?: 'asc' | 'desc';
  filters?: StoresFilters;
}

export const useOptimizedStores = (options: UseOptimizedStoresOptions = {}) => {
  const { 
    page = 1, 
    pageSize = 12,
    searchQuery = '',
    sortBy = 'created_at',
    sortOrder = 'desc',
    filters = {}
  } = options;

  const { data, isLoading, error } = useQuery({
    queryKey: ['optimized-stores', page, pageSize, searchQuery, sortBy, sortOrder, filters],
    queryFn: async () => {
      // Построение запроса с подсчетом товаров через LEFT JOIN
      let query = supabase
        .from('stores')
        .select(`
          *,
          store_images(*),
          products!stores_seller_id_fkey(count)
        `)
        .range((page - 1) * pageSize, page * pageSize - 1);

      // Добавляем поиск если есть запрос
      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`);
      }

      // Применяем фильтры
      if (filters.verified !== undefined) {
        query = query.eq('verified', filters.verified);
      }

      if (filters.minRating !== undefined) {
        query = query.gte('rating', filters.minRating);
      }

      if (filters.location) {
        query = query.ilike('address', `%${filters.location}%`);
      }

      if (filters.tags && filters.tags.length > 0) {
        // Фильтр по тегам - проверяем пересечение массивов
        query = query.overlaps('tags', filters.tags);
      }

      // Добавляем сортировку
      if (sortBy === 'product_count') {
        // Для сортировки по количеству товаров нужен отдельный запрос
        query = query.order('created_at', { ascending: sortOrder === 'asc' });
      } else {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      }

      const { data: storesData, error: storesError } = await query;
      
      if (storesError) throw storesError;
      if (!storesData) return { stores: [], totalCount: 0 };

      // Получаем количество товаров для каждого магазина одним запросом
      const sellerIds = storesData.map(store => store.seller_id).filter(Boolean);
      
      let productCounts: { [key: string]: number } = {};
      
      if (sellerIds.length > 0) {
        const { data: countData, error: countError } = await supabase
          .from('products')
          .select('seller_id')
          .in('seller_id', sellerIds)
          .eq('status', 'active');
        
        if (!countError && countData) {
          // Подсчитываем товары по продавцам
          productCounts = countData.reduce((acc, product) => {
            acc[product.seller_id] = (acc[product.seller_id] || 0) + 1;
            return acc;
          }, {} as { [key: string]: number });
        }
      }

      // Объединяем данные
      let storesWithCounts: OptimizedStoreData[] = storesData.map(store => ({
        ...store,
        product_count: productCounts[store.seller_id || ''] || 0
      }));

      // Применяем фильтр по минимальному количеству товаров
      if (filters.minProductCount !== undefined) {
        storesWithCounts = storesWithCounts.filter(store => 
          store.product_count >= filters.minProductCount!
        );
      }

      // Если нужна сортировка по количеству товаров, делаем это после получения данных
      if (sortBy === 'product_count') {
        storesWithCounts.sort((a, b) => 
          sortOrder === 'asc' 
            ? a.product_count - b.product_count 
            : b.product_count - a.product_count
        );
      }

      // Получаем общее количество для пагинации с учетом фильтров
      let totalCountQuery = supabase
        .from('stores')
        .select('*', { count: 'exact', head: true });

      if (searchQuery.trim()) {
        totalCountQuery = totalCountQuery.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`);
      }

      if (filters.verified !== undefined) {
        totalCountQuery = totalCountQuery.eq('verified', filters.verified);
      }

      if (filters.minRating !== undefined) {
        totalCountQuery = totalCountQuery.gte('rating', filters.minRating);
      }

      if (filters.location) {
        totalCountQuery = totalCountQuery.ilike('address', `%${filters.location}%`);
      }

      if (filters.tags && filters.tags.length > 0) {
        totalCountQuery = totalCountQuery.overlaps('tags', filters.tags);
      }

      const { count: totalCount } = await totalCountQuery;

      return {
        stores: storesWithCounts,
        totalCount: totalCount || 0,
        hasNextPage: page * pageSize < (totalCount || 0),
        hasPreviousPage: page > 1
      };
    },
    staleTime: 1000 * 60 * 5, // 5 минут кэширования
    gcTime: 1000 * 60 * 10, // 10 минут в памяти
  });

  return {
    data: data?.stores || [],
    totalCount: data?.totalCount || 0,
    hasNextPage: data?.hasNextPage || false,
    hasPreviousPage: data?.hasPreviousPage || false,
    isLoading,
    error
  };
};

// Хук для получения доступных фильтров
export const useStoreFilterOptions = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['store-filter-options'],
    queryFn: async () => {
      // Получаем уникальные теги
      const { data: tagsData } = await supabase
        .from('stores')
        .select('tags')
        .not('tags', 'is', null);

      // Получаем уникальные локации из адресов
      const { data: locationsData } = await supabase
        .from('stores')
        .select('address')
        .not('address', 'is', null);

      const allTags = new Set<string>();
      tagsData?.forEach(store => {
        if (store.tags) {
          store.tags.forEach((tag: string) => allTags.add(tag));
        }
      });

      const allLocations = new Set<string>();
      locationsData?.forEach(store => {
        if (store.address) {
          // Извлекаем города из адресов (простое разделение по запятой)
          const parts = store.address.split(',').map(part => part.trim());
          if (parts.length > 0) {
            allLocations.add(parts[0]); // Первая часть адреса как город
          }
        }
      });

      return {
        availableTags: Array.from(allTags).sort(),
        availableLocations: Array.from(allLocations).sort()
      };
    },
    staleTime: 1000 * 60 * 10, // 10 минут кэширования для опций фильтров
  });

  return {
    availableTags: data?.availableTags || [],
    availableLocations: data?.availableLocations || [],
    isLoading
  };
};
