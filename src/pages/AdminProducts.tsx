import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from "@/components/ui/use-toast";
import { useIntersection } from '@/hooks/useIntersection';
import RefactoredProductSearchFilters from '@/components/admin/RefactoredProductSearchFilters';
import ProductsGrid from '@/components/admin/productGrid/ProductsGrid';
import LoadMoreTrigger from '@/components/admin/productGrid/LoadMoreTrigger';
import { useProductFilters } from '@/hooks/useProductFilters';

const PRODUCTS_PER_PAGE = 20;

const AdminProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  
  // Reference for the loading trigger element
  const loadMoreRef = useRef<HTMLDivElement>(null);
  // Using the intersection observer to detect when user scrolls to the bottom
  const isIntersecting = useIntersection(loadMoreRef, '200px');
  
  // Use our custom hook for filters - simplified version without filters
  const {
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    resetAllFilters
  } = useProductFilters([], 
    // onApplyFilters callback
    useCallback(() => {
      refetch();
    }, []) // refetch будет определена позже через useInfiniteQuery
  );
  
  // Удаление товара - оптимизировано с useCallback
  const handleDeleteProduct = useCallback(async (productId: string) => {
    if (isDeleting) return; // Предотвращаем множественные запросы
    
    try {
      setIsDeleting(true);
      setDeleteProductId(productId);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        throw new Error(error.message);
      } else {
        toast({
          title: "Успех",
          description: "Товар успешно удален",
          group: "product-delete" // Группировка похожих уведомлений
        });
        
        queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось удалить товар: " + (error instanceof Error ? error.message : String(error)),
        group: "product-delete-error" // Группировка ошибок удаления
      });
      console.error('Error deleting product:', error);
    } finally {
      setIsDeleting(false);
      setDeleteProductId(null);
    }
  }, [isDeleting, queryClient, toast]);

  // Handle search
  const handleSearch = useCallback(() => {
    if (searchTerm.trim()) {
      setActiveSearchTerm(searchTerm.trim());
      // Reset pagination when searching
      queryClient.resetQueries({ queryKey: ['admin', 'products'] });
    }
  }, [searchTerm, queryClient]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setActiveSearchTerm('');
    queryClient.resetQueries({ queryKey: ['admin', 'products'] });
  }, [queryClient]);

  // Ключ запроса с зависимостями сортировки и поиска
  const queryKey = useMemo(() => ['admin', 'products', sortField, sortOrder, activeSearchTerm], 
    [sortField, sortOrder, activeSearchTerm]);

  // Формирование функции запроса с оптимизациями
  const queryFn = useCallback(async ({ pageParam = 1 }) => {
    try {
      console.log('Выполнение запроса с параметрами:', { 
        sortField, sortOrder,
        searchTerm: activeSearchTerm,
        pageParam
      });
      
      // Calculate the start and end range for pagination
      const from = (pageParam - 1) * PRODUCTS_PER_PAGE;
      const to = from + PRODUCTS_PER_PAGE - 1;
      
      let query = supabase
        .from('products')
        .select(`
          *,
          product_images(url, is_primary),
          profiles(full_name, rating, opt_id)
        `);

      // Apply search if active
      if (activeSearchTerm) {
        query = query.or(`title.ilike.%${activeSearchTerm}%,description.ilike.%${activeSearchTerm}%,brand.ilike.%${activeSearchTerm}%,model.ilike.%${activeSearchTerm}%,optid_created.ilike.%${activeSearchTerm}%,lot_number.eq.${!isNaN(parseInt(activeSearchTerm)) ? parseInt(activeSearchTerm) : 0}`);
      }

      // Применяем сортировку
      if (sortField === 'status') {
        console.log('Сортировка по статусу');
        // Если сортировка по статусу, сначала сортируем по статусу, затем по дате для удобства
        query = query.order('status', { ascending: true }).order('created_at', { ascending: false });
      } else {
        console.log(`Сортировка по ${sortField}, порядок: ${sortOrder}`);
        query = query.order(sortField, { ascending: sortOrder === 'asc' });
      }
      
      // Apply pagination
      console.log(`Применение пагинации: от ${from} до ${to}`);
      query = query.range(from, to);
      
      console.log('Выполнение запроса...');
      const { data, error } = await query;
      
      if (error) {
        console.error('Ошибка запроса:', error);
        throw new Error(`Ошибка Supabase: ${error.message}`);
      }

      console.log(`Получено ${data?.length || 0} товаров`);

      // Check if we have more pages
      const hasMore = data && data.length === PRODUCTS_PER_PAGE;

      if (sortField === 'status') {
        const statusOrder = { pending: 0, active: 1, sold: 2, archived: 3 };
        return {
          products: data ? data.sort((a, b) => 
            statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]
          ) : [],
          nextPage: hasMore ? pageParam + 1 : undefined
        };
      }

      return {
        products: data || [],
        nextPage: hasMore ? pageParam + 1 : undefined
      };
    } catch (error) {
      console.error('Критическая ошибка при получении товаров:', error);
      // Показываем более подробную информацию об ошибке
      let errorMessage = 'Неизвестная ошибка';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Стек ошибки:', error.stack);
      } else {
        console.error('Неизвестный тип ошибки:', error);
      }
      
      throw new Error(errorMessage);
    }
  }, [sortField, sortOrder, activeSearchTerm]);

  // Query products with filters
  const {
    data: productsData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isError,
    error
  } = useInfiniteQuery({
    queryKey,
    queryFn,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    staleTime: 30000, // Данные считаются свежими в течение 30 секунд
    refetchOnWindowFocus: false, // Не обновлять при фокусе окна
  });

  // Flatten the pages of products into a single array - мемоизация для предотвращения повторных вычислений
  const products = useMemo(() => 
    productsData?.pages?.flatMap(page => page.products) || [], 
    [productsData?.pages]
  );

  // Обработчик обновления статуса продукта
  const handleStatusChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
  }, [queryClient]);

  // Load more products when the user scrolls to the bottom or clicks the load more button
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      console.log('Auto-loading additional products on scroll...');
      // We're keeping the automatic loading on scroll
    }
  }, [isIntersecting, fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Updated to add manual load more functionality
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      console.log('Manually loading more products...');
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Фильтры и сортировка */}
        <RefactoredProductSearchFilters
          sortField={sortField}
          sortOrder={sortOrder}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeSearchTerm={activeSearchTerm}
          products={products}
          setSortField={setSortField}
          setSortOrder={setSortOrder}
          resetAllFilters={resetAllFilters}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
        />

        {/* Сетка товаров */}
        <ProductsGrid 
          products={products}
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
          onDelete={handleDeleteProduct}
          isDeleting={isDeleting}
          deleteProductId={deleteProductId}
          onStatusChange={handleStatusChange}
        />
        
        {/* Loading indicator, intersection observer target, and load more button */}
        <LoadMoreTrigger 
          hasNextPage={hasNextPage} 
          isFetchingNextPage={isFetchingNextPage} 
          innerRef={loadMoreRef}
          onLoadMore={handleLoadMore}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
