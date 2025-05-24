
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StoreWithImages } from '@/types/store';

interface OptimizedStoreData extends StoreWithImages {
  product_count: number;
}

interface UseOptimizedStoresOptions {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  sortBy?: 'created_at' | 'rating' | 'product_count' | 'name';
  sortOrder?: 'asc' | 'desc';
  filters?: {};
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
    queryKey: ['optimized-stores', page, pageSize, searchQuery, sortBy, sortOrder],
    queryFn: async () => {
      console.log('🔍 Starting stores query with options:', { page, pageSize, searchQuery, sortBy, sortOrder });
      
      // Построение запроса без фильтров
      let query = supabase
        .from('stores')
        .select(`
          *,
          store_images(*)
        `)
        .range((page - 1) * pageSize, page * pageSize - 1);

      console.log('📊 Base query created, applying search...');

      // Добавляем поиск если есть запрос
      if (searchQuery.trim()) {
        console.log('🔎 Applying search query:', searchQuery);
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`);
      }

      // Добавляем сортировку (кроме product_count)
      if (sortBy !== 'product_count') {
        console.log('📋 Sorting by:', sortBy, 'order:', sortOrder);
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      }

      console.log('🚀 Executing stores query...');
      const { data: storesData, error: storesError } = await query;
      
      if (storesError) {
        console.error('❌ Stores query error:', storesError);
        throw storesError;
      }
      
      console.log('📦 Raw stores data received:', storesData?.length || 0, 'stores');
      
      if (!storesData) {
        console.log('⚠️ No stores data returned');
        return { 
          stores: [], 
          totalCount: 0,
          hasNextPage: false,
          hasPreviousPage: false
        };
      }

      // Получаем количество товаров для каждого магазина отдельным запросом
      const sellerIds = storesData.map(store => store.seller_id).filter(Boolean);
      console.log('👤 Seller IDs found:', sellerIds.length);
      
      let productCounts: { [key: string]: number } = {};
      
      if (sellerIds.length > 0) {
        console.log('🔢 Fetching product counts for sellers...');
        const { data: countData, error: countError } = await supabase
          .from('products')
          .select('seller_id')
          .in('seller_id', sellerIds)
          .eq('status', 'active');
        
        if (!countError && countData) {
          productCounts = countData.reduce((acc, product) => {
            acc[product.seller_id] = (acc[product.seller_id] || 0) + 1;
            return acc;
          }, {} as { [key: string]: number });
          console.log('📊 Product counts calculated:', productCounts);
        } else if (countError) {
          console.error('❌ Product count query error:', countError);
        }
      }

      // Объединяем данные
      let storesWithCounts: OptimizedStoreData[] = storesData.map(store => ({
        ...store,
        product_count: productCounts[store.seller_id || ''] || 0
      }));

      console.log('🔗 Stores with product counts:', storesWithCounts.length);

      // Если нужна сортировка по количеству товаров, делаем это после получения данных
      if (sortBy === 'product_count') {
        console.log('📦 Sorting by product count...');
        storesWithCounts.sort((a, b) => 
          sortOrder === 'asc' 
            ? a.product_count - b.product_count 
            : b.product_count - a.product_count
        );
      }

      // Получаем общее количество для пагинации
      console.log('🔢 Fetching total count...');
      let totalCountQuery = supabase
        .from('stores')
        .select('*', { count: 'exact', head: true });

      if (searchQuery.trim()) {
        totalCountQuery = totalCountQuery.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`);
      }

      const { count: totalCount } = await totalCountQuery;
      console.log('📊 Total count received:', totalCount);

      const result = {
        stores: storesWithCounts,
        totalCount: totalCount || 0,
        hasNextPage: page * pageSize < (totalCount || 0),
        hasPreviousPage: page > 1
      };

      console.log('✅ Final result:', {
        storesCount: result.stores.length,
        totalCount: result.totalCount,
        hasNextPage: result.hasNextPage,
        hasPreviousPage: result.hasPreviousPage
      });

      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 минут кэширования
    gcTime: 1000 * 60 * 10, // 10 минут в памяти
  });

  console.log('🎯 Hook result:', {
    dataLength: data?.stores?.length || 0,
    totalCount: data?.totalCount || 0,
    isLoading,
    hasError: !!error
  });

  if (error) {
    console.error('❌ Hook error:', error);
  }

  return {
    data: data?.stores || [],
    totalCount: data?.totalCount || 0,
    hasNextPage: data?.hasNextPage || false,
    hasPreviousPage: data?.hasPreviousPage || false,
    isLoading,
    error
  };
};
