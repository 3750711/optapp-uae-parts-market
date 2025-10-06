import { useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';
import { adminProductsKeys } from '@/utils/cacheKeys';

interface UseProductsQueryProps {
  debouncedSearchTerm: string;
  statusFilter: string;
  sellerFilter: string;
  notificationIssuesFilter?: boolean;
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
  notificationIssuesFilter = false,
  pageSize = 12
}: UseProductsQueryProps) => {
  const queryClient = useQueryClient();

  const fetchProducts = async ({ pageParam = 0 }: { pageParam?: number }): Promise<Page> => {
    console.log('[AdminProducts] Fetching products:', {
      page: pageParam,
      search: debouncedSearchTerm,
      status: statusFilter,
      seller: sellerFilter,
      notificationIssues: notificationIssuesFilter,
      pageSize
    });

    // Если включен фильтр проблемных уведомлений - использовать RPC функцию
    if (notificationIssuesFilter) {
      console.log('[AdminProducts] Using RPC for notification issues filter');

      // First, get the total count
      const { data: countData, error: countError } = await supabase
        .rpc('count_products_with_notification_issues', {
          p_search: debouncedSearchTerm || null,
          p_status: statusFilter !== 'all' ? statusFilter : 'all',
          p_seller_id: sellerFilter !== 'all' ? sellerFilter : null
        });

      if (countError) {
        console.error('[AdminProducts] Count RPC error:', countError);
        throw new Error(`Failed to count products with notification issues: ${countError.message}`);
      }

      const totalCount = Number(countData) || 0;
      console.log('[AdminProducts] Total count:', totalCount);

      // Then get the actual products
      const { data, error } = await supabase
        .rpc('get_products_with_notification_issues', {
          p_limit: pageSize,
          p_offset: pageParam * pageSize,
          p_search: debouncedSearchTerm || null,
          p_status: statusFilter !== 'all' ? statusFilter : 'all',
          p_seller_id: sellerFilter !== 'all' ? sellerFilter : null
        });

      if (error) {
        console.error('[AdminProducts] RPC error:', error);
        throw new Error(`Failed to fetch products with notification issues: ${error.message}`);
      }

      console.log('[AdminProducts] RPC returned products:', data?.length);

      // Fetch product_images separately
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

      // Fetch notification logs for these products
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

      const dataWithImagesAndLogs = data?.map(product => ({
        ...product,
        product_images: (imagesMap[product.id] || []).slice().sort((a: any, b: any) => {
          if (a.is_primary && !b.is_primary) return -1;
          if (!a.is_primary && b.is_primary) return 1;
          return 0;
        }),
        notification_logs: logsMap[product.id] || []
      })) as Product[];

      console.log('[AdminProducts] Final data:', {
        productsCount: data?.length || 0,
        totalCount,
        hasMore: (data?.length || 0) === pageSize
      });

      return { 
        data: dataWithImagesAndLogs || [], 
        count: totalCount
      };
    }

    // Обычный запрос без фильтра проблемных уведомлений
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
      // Helper functions for search processing
      const escapePostgRESTTerm = (term: string): string => {
        return term.replace(/[%_]/g, '\\$&');
      };

      const normalizeText = (text: string): string => {
        return text.replace(/ё/g, 'е').replace(/Ё/g, 'Е');
      };

      // Process search term
      const normalizedSearchTerm = normalizeText(debouncedSearchTerm.toLowerCase().trim());
      const searchWords = normalizedSearchTerm.split(/\s+/).filter(word => word.length > 0);

      console.log('🔍 Products Search Debug:', {
        originalTerm: debouncedSearchTerm,
        normalizedTerm: normalizedSearchTerm,
        searchWords,
        wordCount: searchWords.length
      });

      if (searchWords.length === 1) {
        // Single word search - OR across all fields
        const word = escapePostgRESTTerm(searchWords[0]);
        const isNumeric = !isNaN(Number(word));
        
        if (isNumeric) {
          // Search in both text and numeric fields
          query = query.or(
            `lot_number.eq.${Number(word)},` +
            `place_number.eq.${Number(word)},` +
            `title.ilike.%${word}%,` +
            `brand.ilike.%${word}%,` +
            `model.ilike.%${word}%,` +
            `seller_name.ilike.%${word}%,` +
            `description.ilike.%${word}%`
          );
        } else {
          // Search only in text fields
          query = query.or(
            `title.ilike.%${word}%,` +
            `brand.ilike.%${word}%,` +
            `model.ilike.%${word}%,` +
            `seller_name.ilike.%${word}%,` +
            `description.ilike.%${word}%`
          );
        }

        console.log('🔍 Single word search applied:', { word, isNumeric });
      } else {
        // Multiple words - AND logic between words, OR within each word across fields
        const wordConditions = searchWords.map(word => {
          const escapedWord = escapePostgRESTTerm(word);
          const isNumeric = !isNaN(Number(escapedWord));
          
          if (isNumeric) {
            return `lot_number.eq.${Number(escapedWord)},` +
                   `place_number.eq.${Number(escapedWord)},` +
                   `title.ilike.%${escapedWord}%,` +
                   `brand.ilike.%${escapedWord}%,` +
                   `model.ilike.%${escapedWord}%,` +
                   `seller_name.ilike.%${escapedWord}%,` +
                   `description.ilike.%${escapedWord}%`;
          } else {
            return `title.ilike.%${escapedWord}%,` +
                   `brand.ilike.%${escapedWord}%,` +
                   `model.ilike.%${escapedWord}%,` +
                   `seller_name.ilike.%${escapedWord}%,` +
                   `description.ilike.%${escapedWord}%`;
          }
        });

        // Apply AND logic: wrap each word condition in or(), then chain with and()
        const orConditions = wordConditions.map(condition => `or(${condition})`);
        const finalCondition = `and(${orConditions.join(',')})`;
        
        query = query.or(finalCondition);

        console.log('🔍 Multi-word search applied:', {
          wordConditions: wordConditions.length,
          finalCondition: finalCondition.substring(0, 100) + '...'
        });
      }
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

    // Fetch notification logs separately to avoid PGRST200 foreign key error
    let logsMap: Record<string, any[]> = {};
    if (data && data.length > 0) {
      const productIds = data.map(p => p.id);
      const { data: logs } = await supabase
        .from('telegram_notifications_log')
        .select('id, status, created_at, notification_type, related_entity_id')
        .in('related_entity_id', productIds)
        .eq('status', 'sent')
        .in('notification_type', ['product_published', 'status_change']);
      
      // Group logs by product_id
      logs?.forEach(log => {
        if (!logsMap[log.related_entity_id]) {
          logsMap[log.related_entity_id] = [];
        }
        logsMap[log.related_entity_id].push(log);
      });
    }

    // Sort product_images so primary images come first (non-mutating)
    // Attach notification_logs from separate query
    const dataWithSortedImages = data?.map(product => ({
      ...product,
      product_images: product.product_images?.slice().sort((a: any, b: any) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return 0;
      }),
      notification_logs: logsMap[product.id] || []
    })) as Product[];

    return { 
      data: dataWithSortedImages || [], 
      count: count || 0 
    };
  };

  const queryResult = useInfiniteQuery({
    queryKey: adminProductsKeys.list({ debouncedSearchTerm, statusFilter, sellerFilter, notificationIssuesFilter, pageSize }),
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
