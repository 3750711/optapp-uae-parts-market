import { useMemo, useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  const queryClient = useQueryClient();

  const fetchProducts = async ({ pageParam = 0 }) => {
    const { data: { session } } = await supabase.auth.getSession();

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
      console.error('❌ Error fetching products:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
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
  };

  const queryResult = useInfiniteQuery({
    queryKey: ['admin-products', debouncedSearchTerm, statusFilter, sellerFilter],
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

  // Real-time subscription for products changes
  useEffect(() => {
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `status=in.(active,sold,pending)`
        },
        (payload) => {
          // Invalidate products query to refetch updated data
          queryClient.invalidateQueries({ queryKey: ['admin-products'] });
          queryClient.invalidateQueries({ queryKey: ['products-infinite'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    ...queryResult,
    products: allProducts
  };
};
