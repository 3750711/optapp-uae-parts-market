
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
      // Диагностическая информация о сессии
      console.log('🔍 Fetching products:', { 
        pageParam, 
        searchTerm: debouncedSearchTerm, 
        statusFilter,
        sellerFilter
      });

      // Проверяем текущую сессию
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔐 Current session:', {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        sessionError: sessionError?.message
      });

      // Проверяем профиль пользователя
      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type, email')
          .eq('id', session.user.id)
          .single();
        
        console.log('👤 User profile:', {
          userType: profile?.user_type,
          email: profile?.email,
          profileError: profileError?.message
        });
      }

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

      console.log('📡 Executing query...');
      const { data, error, count } = await query;

      console.log('📊 Query result:', {
        hasData: !!data,
        dataLength: data?.length || 0,
        count,
        error: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details
      });

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

      console.log('✅ Products fetched successfully:', dataWithSortedImages?.length || 0);

      return { 
        data: dataWithSortedImages || [], 
        count: count || 0 
      };
    } catch (error) {
      console.error('💥 Exception in fetchProducts:', error);
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
      console.log('🔄 Query retry attempt:', { failureCount, errorMessage: error?.message });
      
      // Не повторяем запросы при проблемах с авторизацией
      if (error?.message?.includes('permission') || 
          error?.message?.includes('unauthorized') ||
          error?.message?.includes('JWT') ||
          error?.code === 'PGRST301') {
        console.log('🚫 Not retrying due to auth error');
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

  // Логируем состояние запроса
  console.log('📈 Query state:', {
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error?.message,
    productsCount: allProducts.length
  });

  return {
    ...queryResult,
    products: allProducts
  };
};
