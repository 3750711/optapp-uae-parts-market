
import React, { useState, useRef, useEffect } from 'react';
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
  
  // Состояние для выбранных товаров
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
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
    () => {
      setSelectedProducts([]);
      refetch();
    }
  );
  
  // Удаление товара
  const handleDeleteProduct = async (productId: string) => {
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
        
        // Удаляем из списка выбранных, если товар был выбран
        if (selectedProducts.includes(productId)) {
          setSelectedProducts(prev => prev.filter(id => id !== productId));
        }
        
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
  };
  
  // Удаление нескольких выбранных товаров
  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0 || isDeleting) return;
    
    try {
      setIsDeleting(true);
      
      const promises = selectedProducts.map(productId => 
        supabase.from('products').delete().eq('id', productId)
      );
      
      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error).map(result => result.error);
      
      if (errors.length > 0) {
        console.error('Errors deleting products:', errors);
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: `Не удалось удалить ${errors.length} товаров`,
          group: "bulk-delete-error" // Группировка ошибок массового удаления
        });
      } else {
        toast({
          title: "Успех",
          description: `Удалено товаров: ${selectedProducts.length}`,
          group: "bulk-delete" // Группировка уведомлений о массовом удалении
        });
        setSelectedProducts([]);
      }
      
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось выполнить массовое удаление: " + (error instanceof Error ? error.message : String(error)),
        group: "bulk-delete-error"
      });
      console.error('Error bulk deleting products:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Выбор/отмена выбора товара
  const handleToggleProductSelect = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };
  
  // Выбор/отмена выбора всех товаров
  const handleToggleAllSelected = (selected: boolean) => {
    if (selected) {
      const allProductIds = products.map(product => product.id);
      setSelectedProducts(allProductIds);
    } else {
      setSelectedProducts([]);
    }
  };

  // Query products with filters - removed filter logic
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
    queryKey: ['admin', 'products', sortField, sortOrder],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        console.log('Выполнение запроса с параметрами:', { 
          sortField, sortOrder,
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
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    staleTime: 30000, // Данные считаются свежими в течение 30 секунд
    refetchOnWindowFocus: false, // Не обновлять при фокусе окна
  });

  // Flatten the pages of products into a single array
  const products = productsData?.pages?.flatMap(page => page.products) || [];

  // Load more products when the user scrolls to the bottom
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      console.log('Загрузка дополнительных товаров...');
      fetchNextPage();
    }
  }, [isIntersecting, fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Фильтры и сортировка - removed filters */}
        <RefactoredProductSearchFilters
          sortField={sortField}
          sortOrder={sortOrder}
          products={products}
          selectedProducts={selectedProducts}
          isDeleting={isDeleting}
          setSortField={setSortField}
          setSortOrder={setSortOrder}
          onDeleteSelected={handleDeleteSelected}
          onToggleAllSelected={handleToggleAllSelected}
          resetAllFilters={resetAllFilters}
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
          selectedProducts={selectedProducts}
          onSelectToggle={handleToggleProductSelect}
          onStatusChange={() => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
          }}
        />
        
        {/* Loading indicator and intersection observer target */}
        <LoadMoreTrigger 
          hasNextPage={hasNextPage} 
          isFetchingNextPage={isFetchingNextPage} 
          innerRef={loadMoreRef} 
        />
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
