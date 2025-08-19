import { useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';

interface UseProductsQueryProps {
  debouncedSearchTerm: string;
  statusFilter: string;
  sellerFilter: string;
  pageSize?: number;
}

interface Page {
  data: Product[];
  count: number;
}

// Escape LIKE wildcards to prevent unintended pattern matching
const escapeLikePattern = (input: string): string => {
  return input.replace(/[%_]/g, '\\$&');
};

export const useProductsQuery = ({
  debouncedSearchTerm,
  statusFilter,
  sellerFilter,
  pageSize = 12
}: UseProductsQueryProps) => {
  const queryClient = useQueryClient();

  const fetchProducts = async ({ pageParam = 0 }: { pageParam?: number }): Promise<Page> => {
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
      const escapedTerm = escapeLikePattern(debouncedSearchTerm.trim());
      query = query.ilike('title', `%${escapedTerm}%`);
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (sellerFilter !== 'all') {
      query = query.eq('seller_id', sellerFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching products:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      // Preserve error metadata for better debugging
      const enhancedError = Object.assign(
        new Error(error.message),
        { code: error.code, details: error.details, hint: error.hint }
      );
      throw enhancedError;
    }

    // Sort product_images so primary images come first (non-mutating)
    const dataWithSortedImages = data?.map(product => ({
      ...product,
      product_images: product.product_images?.slice().sort((a: any, b: any) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return 0;
      })
    })) as Product[];

    return { 
      data: dataWithSortedImages || [], 
      count: count || 0 
    };
  };

  const queryResult = useInfiniteQuery({
    queryKey: ['admin-products', { debouncedSearchTerm, statusFilter, sellerFilter, pageSize }],
    queryFn: fetchProducts,
    getNextPageParam: (lastPage, allPages) => {
      const totalItems = allPages.reduce((sum, page) => sum + page.data.length, 0);
      const totalCount = lastPage.count;
      return totalItems < totalCount ? allPages.length : undefined;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });

  const allProducts = useMemo(() => {
    return queryResult.data?.pages.flatMap(page => page.data) || [];
  }, [queryResult.data]);

  // Real-time subscription now handled by unified RealtimeProvider
  // This hook only manages the query logic
  // Realtime updates are handled centrally to prevent duplicate subscriptions

  return {
    ...queryResult,
    products: allProducts
  };
};
