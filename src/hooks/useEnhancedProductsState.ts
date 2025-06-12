import { useState, useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOptimizedProductsSearch } from './useOptimizedProductsSearch';

interface Product {
  id: string;
  created_at: string;
  title: string;
  price: number;
  status: string;
  seller_id: string;
  seller_name: string;
  [key: string]: any;
}

interface UseEnhancedProductsStateProps {
  pageSize?: number;
  initialFilters?: {
    status?: string;
    sellerId?: string;
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
  const [sellerFilter, setSellerFilter] = useState(initialFilters.sellerId || 'all');
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

  // Fetch all unique sellers separately
  const {
    data: allSellers = [],
    isLoading: isSellersLoading
  } = useQuery({
    queryKey: ['admin-products-sellers'],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching all unique sellers...');

        const { data, error } = await supabase
          .from('products')
          .select('seller_id, seller_name, optid_created')
          .not('seller_id', 'is', null)
          .not('seller_name', 'is', null);

        if (error) {
          console.error('❌ Error fetching sellers:', error);
          throw error;
        }

        // Extract unique sellers
        const uniqueSellers = new Map();
        data?.forEach(product => {
          if (product.seller_id && product.seller_name) {
            uniqueSellers.set(product.seller_id, {
              id: product.seller_id,
              name: product.seller_name,
              opt_id: product.optid_created
            });
          }
        });

        const sellers = Array.from(uniqueSellers.values()).sort((a, b) => a.name.localeCompare(b.name));
        console.log('✅ Loaded sellers:', sellers.length);
        return sellers;
      } catch (error) {
        handleError(error, {
          customMessage: 'Ошибка при загрузке списка продавцов',
          logError: true
        });
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    gcTime: 1000 * 60 * 10, // 10 minutes in memory,
  });

  // Fetch function with enhanced error handling
  const fetchProducts = useCallback(async ({ pageParam = 0 }) => {
    try {
      console.log('🔍 Fetching products:', { 
        pageParam, 
        searchTerm: debouncedSearchTerm, 
        statusFilter,
        sellerFilter
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

      if (sellerFilter !== 'all') {
        query = query.eq('seller_id', sellerFilter);
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
  }, [debouncedSearchTerm, statusFilter, sellerFilter, pageSize, handleError]);

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
    queryKey: ['admin-products', debouncedSearchTerm, statusFilter, sellerFilter],
    queryFn: fetchProducts,
    getNextPageParam: (lastPage, allPages) => {
      const totalItems = allPages.reduce((sum, page) => sum + page.data.length, 0);
      const totalCount = lastPage.count;
      return totalItems < totalCount ? allPages.length : undefined;
    },
    initialPageParam: 0,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('permission') || error?.message?.includes('unauthorized')) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });

  // Memoized products list
  const allProducts = useMemo(() => {
    return data?.pages.flatMap(page => page.data) || [];
  }, [data]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    clearSearch();
    setStatusFilter('all');
    setSellerFilter('all');
  }, [clearSearch]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return hasActiveSearch || 
           statusFilter !== 'all' || 
           sellerFilter !== 'all';
  }, [hasActiveSearch, statusFilter, sellerFilter]);

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
    sellerFilter,
    setSellerFilter,
    
    // Sellers data
    allSellers,
    isSellersLoading,
    
    // Selection state
    selectedProducts,
    setSelectedProducts,
    
    // Utility functions
    clearFilters,
    hasActiveFilters
  };
};
