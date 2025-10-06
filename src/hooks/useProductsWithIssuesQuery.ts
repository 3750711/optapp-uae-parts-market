import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';

interface UseProductsWithIssuesQueryProps {
  debouncedSearchTerm: string;
  statusFilter: string;
  sellerFilter: string;
  pageSize?: number;
}

interface Page {
  data: Product[];
  count: number;
}

export const useProductsWithIssuesQuery = ({
  debouncedSearchTerm,
  statusFilter,
  sellerFilter,
  pageSize = 12
}: UseProductsWithIssuesQueryProps) => {
  const fetchProducts = async ({ pageParam = 0 }: { pageParam?: number }): Promise<Page> => {
    console.log('[ProductsWithIssues] Fetching products with notification issues:', {
      page: pageParam,
      search: debouncedSearchTerm,
      status: statusFilter,
      seller: sellerFilter,
      pageSize
    });

    // 1. Get total count
    const { data: countData, error: countError } = await supabase
      .rpc('count_products_with_notification_issues', {
        p_search: debouncedSearchTerm || null,
        p_status: statusFilter !== 'all' ? statusFilter : 'all',
        p_seller_id: sellerFilter !== 'all' ? sellerFilter : null
      });

    if (countError) {
      console.error('[ProductsWithIssues] Count RPC error:', {
        message: countError.message,
        code: countError.code,
        hint: countError.hint,
        details: countError.details
      });
      throw new Error(`Failed to count products with notification issues: ${countError.message}`);
    }

    const totalCount = Number(countData) || 0;
    console.log('[ProductsWithIssues] ✅ Successfully fetched count:', {
      totalCount,
      filters: { search: debouncedSearchTerm, status: statusFilter, seller: sellerFilter }
    });

    // 2. Get products with issues
    const { data, error } = await supabase
      .rpc('get_products_with_notification_issues', {
        p_limit: pageSize,
        p_offset: pageParam * pageSize,
        p_search: debouncedSearchTerm || null,
        p_status: statusFilter !== 'all' ? statusFilter : 'all',
        p_seller_id: sellerFilter !== 'all' ? sellerFilter : null
      });

    if (error) {
      console.error('[ProductsWithIssues] RPC error:', {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details
      });
      throw new Error(`Failed to fetch products with notification issues: ${error.message}`);
    }

    console.log('[ProductsWithIssues] ✅ Successfully fetched products:', {
      productsCount: data?.length || 0,
      page: pageParam,
      pageSize
    });

    // 3. Fetch product_images
    let imagesMap: Record<string, any[]> = {};
    if (data && data.length > 0) {
      const productIds = data.map(p => p.id);
      const { data: images } = await supabase
        .from('product_images')
        .select('id, url, is_primary, product_id')
        .in('product_id', productIds);
      
      images?.forEach(img => {
        if (!imagesMap[img.product_id]) {
          imagesMap[img.product_id] = [];
        }
        imagesMap[img.product_id].push(img);
      });
    }

    // 4. Fetch notification logs
    let logsMap: Record<string, any[]> = {};
    if (data && data.length > 0) {
      const productIds = data.map(p => p.id);
      const { data: logs } = await supabase
        .from('telegram_notifications_log')
        .select('id, status, created_at, notification_type, related_entity_id')
        .in('related_entity_id', productIds);
      
      logs?.forEach(log => {
        if (!logsMap[log.related_entity_id]) {
          logsMap[log.related_entity_id] = [];
        }
        logsMap[log.related_entity_id].push(log);
      });
    }

    // 5. Map data with relations
    const dataWithRelations = data?.map(product => ({
      ...product,
      product_images: (imagesMap[product.id] || []).slice().sort((a: any, b: any) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return 0;
      }),
      notification_logs: logsMap[product.id] || []
    })) as Product[];

    console.log('[ProductsWithIssues] Final data:', {
      productsCount: data?.length || 0,
      totalCount,
      hasMore: (data?.length || 0) === pageSize
    });

    return { 
      data: dataWithRelations || [], 
      count: totalCount
    };
  };

  const queryResult = useInfiniteQuery({
    queryKey: ['products-with-issues', { debouncedSearchTerm, statusFilter, sellerFilter, pageSize }],
    queryFn: fetchProducts,
    getNextPageParam: (lastPage, allPages) => {
      const totalItems = allPages.reduce((sum, page) => sum + page.data.length, 0);
      return totalItems < lastPage.count ? allPages.length : undefined;
    },
    initialPageParam: 0,
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
