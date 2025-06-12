
import { useState, useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOptimizedProductsSearch } from './useOptimizedProductsSearch';

interface Product {
  id: string;
  created_at: string;
  title: string;
  price: number;
  status: string;
  [key: string]: any;
}

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface UseEnhancedProductsStateProps {
  pageSize?: number;
  initialFilters?: {
    status?: string;
    dateRange?: DateRange;
    priceRange?: { min: number; max: number };
  };
}

const PAGE_SIZE = 12;

export const useEnhancedProductsState = ({
  pageSize = PAGE_SIZE,
  initialFilters = {}
}: UseEnhancedProductsStateProps = {}) => {
  const { handleError } = useErrorHandler();
  
  // Filters state
  const [statusFilter, setStatusFilter] = useState(initialFilters.status || 'all');
  const [dateRange, setDateRange] = useState<DateRange>(
    initialFilters.dateRange || { from: null, to: null }
  );
  const [priceRange, setPriceRange] = useState(
    initialFilters.priceRange || { min: 0, max: 100000 }
  );
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Search state with debounce
  const {
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    updateSearchTerm,
    clearSearch,
    hasActiveSearch
  } = useOptimizedProductsSearch({
    debounceDelay: 300
  });

  // Fetch function with enhanced error handling
  const fetchProducts = useCallback(async ({ pageParam = 0 }) => {
    try {
      console.log('🔍 Fetching products:', { 
        pageParam, 
        searchTerm: debouncedSearchTerm, 
        statusFilter,
        dateRange,
        priceRange 
      });

      let query = supabase
        .from('products')
        .select(`
          *,
          product_images(id, url, is_primary)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);

      // Apply filters
      if (debouncedSearchTerm) {
        query = query.ilike('title', `%${debouncedSearchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (dateRange.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }

      if (dateRange.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      if (priceRange.min > 0) {
        query = query.gte('price', priceRange.min);
      }

      if (priceRange.max < 100000) {
        query = query.lte('price', priceRange.max);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching products:', error);
        throw error;
      }

      // Sort product_images so primary images come first
      const dataWithSortedImages = data?.map(product => ({
        ...product,
        product_images: product.product_images?.sort((a: any, b: any) => {
          if (a.is_primary && !b.is_primary) return -1;
          if (!a.is_primary && b.is_primary) return 1;
          return 0;
        })
      }));

      return { 
        data: dataWithSortedImages || [], 
        count: count || 0 
      };
    } catch (error) {
      handleError(error, {
        customMessage: 'Ошибка при загрузке товаров',
        logError: true
      });
      throw error;
    }
  }, [debouncedSearchTerm, statusFilter, dateRange, priceRange, pageSize, handleError]);

  // Infinite query with error handling
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['admin-products', debouncedSearchTerm, statusFilter, dateRange, priceRange],
    queryFn: fetchProducts,
    getNextPageParam: (lastPage, allPages) => {
      const totalItems = allPages.reduce((sum, page) => sum + page.data.length, 0);
      const totalCount = lastPage.count;
      return totalItems < totalCount ? allPages.length : undefined;
    },
    initialPageParam: 0,
    retry: (failureCount, error: any) => {
      // Не повторяем при ошибках доступа
      if (error?.message?.includes('permission') || error?.message?.includes('unauthorized')) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 2, // 2 минуты
    gcTime: 1000 * 60 * 5, // 5 минут
  });

  // Memoized products list
  const allProducts = useMemo(() => {
    return data?.pages.flatMap(page => page.data) || [];
  }, [data]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    clearSearch();
    setStatusFilter('all');
    setDateRange({ from: null, to: null });
    setPriceRange({ min: 0, max: 100000 });
  }, [clearSearch]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return hasActiveSearch || 
           statusFilter !== 'all' || 
           dateRange.from !== null || 
           dateRange.to !== null || 
           priceRange.min > 0 || 
           priceRange.max < 100000;
  }, [hasActiveSearch, statusFilter, dateRange, priceRange]);

  return {
    // Products data
    products: allProducts,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    
    // Search state
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    updateSearchTerm,
    clearSearch,
    hasActiveSearch,
    
    // Filters state
    statusFilter,
    setStatusFilter,
    dateRange,
    setDateRange,
    priceRange,
    setPriceRange,
    
    // Selection state
    selectedProducts,
    setSelectedProducts,
    
    // Utility functions
    clearFilters,
    hasActiveFilters
  };
};
