
import { useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';

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

interface UseProductsQueryProps {
  debouncedSearchTerm: string;
  statusFilter: string;
  sellerFilter: string;
  pageSize?: number;
}

export const useProductsQuery = ({
  debouncedSearchTerm,
  statusFilter,
  sellerFilter,
  pageSize = 12
}: UseProductsQueryProps) => {
  const { handleError } = useErrorHandler();

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

  const queryResult = useInfiniteQuery({
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

  const allProducts = useMemo(() => {
    return queryResult.data?.pages.flatMap(page => page.data) || [];
  }, [queryResult.data]);

  return {
    ...queryResult,
    products: allProducts
  };
};
