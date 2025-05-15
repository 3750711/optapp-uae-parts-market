
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from "@/hooks/use-toast";
import { useIntersection } from '@/hooks/useIntersection';
import RefactoredProductSearchFilters from '@/components/admin/RefactoredProductSearchFilters';
import ProductsGrid from '@/components/admin/productGrid/ProductsGrid';
import LoadMoreTrigger from '@/components/admin/productGrid/LoadMoreTrigger';
import { useProductFilters } from '@/hooks/useProductFilters';

const PRODUCTS_PER_PAGE = 20;

const AdminProducts = () => {
  // Clear localStorage on page load to ensure fresh state
  useEffect(() => {
    console.log('AdminProducts mounted - checking localStorage state');
    // We might want to clear it entirely for testing
    // localStorage.removeItem('admin_products_sort_field');
    // localStorage.removeItem('admin_products_sort_order');
  }, []);

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
  
  // Функция для выполнения рефетча данных, будет передана в useProductFilters
  const refetchProducts = useCallback(() => {
    console.log('Refetching products with latest sort settings');
    queryClient.resetQueries({ queryKey: ['admin', 'products'] });
  }, [queryClient]);
  
  // Use our custom hook for filters - simplified version without filters
  const {
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    resetAllFilters
  } = useProductFilters([], refetchProducts);
  
  // Log the current sort settings whenever they change
  useEffect(() => {
    console.log('Current sort settings:', { sortField, sortOrder });
  }, [sortField, sortOrder]);
  
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

  // Формирование функции запроса с правильной сортировкой
  const queryFn = useCallback(async ({ pageParam = 1 }) => {
    try {
      console.log('Executing query with parameters:', { 
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

      // Improved sorting logic with better debugging
      if (sortField === 'status') {
        console.log('Applying special status sorting, order:', sortOrder);
        // Специальная сортировка по статусу
        const statusOrder = sortOrder === 'asc' ? 
          { pending: 0, active: 1, sold: 2, archived: 3 } : 
          { archived: 0, sold: 1, active: 2, pending: 3 };
          
        // Get data without server-side sorting for status
        query = query.order('created_at', { ascending: false });
        
        const { data, error } = await query.range(from, to);
        
        if (error) {
          console.error('Error fetching products:', error);
          throw new Error(error.message);
        }
        
        console.log(`Before sorting - Status of first item: ${data?.[0]?.status}, count: ${data?.length}`);
        
        // Sort fetched data manually by status
        const sortedData = data ? [...data].sort((a, b) => {
          const aValue = statusOrder[a.status as keyof typeof statusOrder] || 999;
          const bValue = statusOrder[b.status as keyof typeof statusOrder] || 999;
          return aValue - bValue;
        }) : [];
        
        console.log(`After sorting - Status of first item: ${sortedData[0]?.status}, count: ${sortedData.length}`);
        
        const hasMore = data && data.length === PRODUCTS_PER_PAGE;
        return {
          products: sortedData,
          nextPage: hasMore ? pageParam + 1 : undefined
        };
      } else {
        // Standard sorting for other fields
        console.log(`Applying regular sorting by ${sortField}, order: ${sortOrder}`);
        query = query.order(sortField, { ascending: sortOrder === 'asc' });
        
        const { data, error } = await query.range(from, to);
        
        if (error) {
          console.error('Error fetching products:', error);
          throw new Error(error.message);
        }

        console.log(`Regular sorting result - first item field value: ${data?.[0]?.[sortField]}, count: ${data?.length}`);
        
        const hasMore = data && data.length === PRODUCTS_PER_PAGE;
        return {
          products: data || [],
          nextPage: hasMore ? pageParam + 1 : undefined
        };
      }
    } catch (error) {
      console.error('Critical error fetching products:', error);
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error stack:', error.stack);
      } else {
        console.error('Unknown error type:', error);
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

  // Log product count and first product status whenever products change
  useEffect(() => {
    if (products.length > 0) {
      console.log(`Products loaded: ${products.length}, first product status: ${products[0]?.status}`);
    }
  }, [products]);

  // Обработчик обновления статуса продукта
  const handleStatusChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
  }, [queryClient]);

  // Load more products when the user scrolls to the bottom or clicks the load more button
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
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
