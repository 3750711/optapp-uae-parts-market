
import React, { useState, useRef, useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from "@/components/ui/use-toast";
import { Product } from '@/types/product';
import { useIntersection } from '@/hooks/useIntersection';
import { Skeleton } from "@/components/ui/skeleton";
import AdminProductCard from '@/components/admin/AdminProductCard';
import ProductSearchFilters from '@/components/admin/ProductSearchFilters';

const PRODUCTS_PER_PAGE = 20;
// Keys for storing sort preferences in localStorage
const SORT_FIELD_KEY = 'admin_products_sort_field';
const SORT_ORDER_KEY = 'admin_products_sort_order';

// Define DateRange interface to ensure consistency
interface DateRange {
  from: Date | null;
  to?: Date | null; // Make 'to' optional to match the library's type
}

interface FiltersState {
  priceRange: [number, number] | null;
  dateRange: DateRange | null;
  status: string | null;
}

const AdminProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'created_at' | 'price' | 'title' | 'status'>('status');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Состояние для поиска
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSearchTerm, setActiveSearchTerm] = useState<string>('');
  
  // Состояние для фильтров
  const [filters, setFilters] = useState<FiltersState>({
    priceRange: null,
    dateRange: null,
    status: null
  });
  
  // Состояние для выбранных товаров
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  // Reference for the loading trigger element
  const loadMoreRef = useRef<HTMLDivElement>(null);
  // Using the intersection observer to detect when user scrolls to the bottom
  const isIntersecting = useIntersection(loadMoreRef, '200px');
  
  // Load saved preferences from localStorage on component mount
  useEffect(() => {
    const savedSortField = localStorage.getItem(SORT_FIELD_KEY) as 'created_at' | 'price' | 'title' | 'status' | null;
    const savedSortOrder = localStorage.getItem(SORT_ORDER_KEY) as 'asc' | 'desc' | null;
    
    if (savedSortField) {
      setSortField(savedSortField);
    }
    
    if (savedSortOrder) {
      setSortOrder(savedSortOrder);
    }
  }, []);
  
  // Save sort preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(SORT_FIELD_KEY, sortField);
    localStorage.setItem(SORT_ORDER_KEY, sortOrder);
  }, [sortField, sortOrder]);
  
  // Функция поиска
  const handleSearch = () => {
    // Убедимся что есть фактическое изменение в поисковом запросе прежде чем перезагружать данные
    if (activeSearchTerm !== searchTerm) {
      setActiveSearchTerm(searchTerm);
      setSelectedProducts([]);
      // Используем refetch вместо invalidateQueries для более контролируемого обновления
      refetch();
    }
  };
  
  // Сброс поиска
  const handleClearSearch = () => {
    if (activeSearchTerm !== '') {
      setSearchTerm('');
      setActiveSearchTerm('');
      setSelectedProducts([]);
      refetch();
    }
  };
  
  // Применить фильтры
  const handleApplyFilters = () => {
    setSelectedProducts([]);
    refetch();
  };
  
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
    queryKey: ['admin', 'products', sortField, sortOrder, activeSearchTerm, filters],
    queryFn: async ({ pageParam = 1 }) => {
      try {
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

        // Apply search if there's an active search term
        if (activeSearchTerm) {
          query = query.or(
            `title.ilike.%${activeSearchTerm}%,` +
            `brand.ilike.%${activeSearchTerm}%,` +
            `model.ilike.%${activeSearchTerm}%,` +
            `description.ilike.%${activeSearchTerm}%,` +
            `seller_name.ilike.%${activeSearchTerm}%,` +
            `lot_number::text.ilike.%${activeSearchTerm}%,` +
            `optid_created.ilike.%${activeSearchTerm}%`
          );
        }
        
        // Apply price filter
        if (filters.priceRange) {
          query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1]);
        }
        
        // Apply status filter
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        
        // Apply date filter
        if (filters.dateRange && filters.dateRange.from) {
          query = query.gte('created_at', filters.dateRange.from.toISOString());
          
          if (filters.dateRange.to) {
            // Add 1 day to the end date to include the full day
            const endDate = new Date(filters.dateRange.to);
            endDate.setDate(endDate.getDate() + 1);
            query = query.lt('created_at', endDate.toISOString());
          }
        }

        // Применяем сортировку
        if (sortField === 'status') {
          // Если сортировка по статусу, сначала сортируем по статусу, затем по дате для удобства
          query = query.order('status', { ascending: true }).order('created_at', { ascending: false });
        } else {
          query = query.order(sortField, { ascending: sortOrder === 'asc' });
        }
        
        // Apply pagination
        query = query.range(from, to);
        
        console.log('Executing query with params:', { 
          sortField, sortOrder, activeSearchTerm, 
          filters: JSON.stringify(filters),
          pageParam
        });
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Query error:', error);
          throw error;
        }

        console.log(`Fetched ${data?.length || 0} products`);

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
        console.error('Error fetching products:', error);
        throw error;
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
      console.log('Loading more products...');
      fetchNextPage();
    }
  }, [isIntersecting, fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Поиск, сортировка и фильтры */}
        <ProductSearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeSearchTerm={activeSearchTerm}
          setActiveSearchTerm={setActiveSearchTerm}
          sortField={sortField}
          sortOrder={sortOrder}
          setSortField={setSortField}
          setSortOrder={setSortOrder}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
          products={products}
          selectedProducts={selectedProducts}
          onDeleteSelected={handleDeleteSelected}
          isDeleting={isDeleting}
          onToggleAllSelected={handleToggleAllSelected}
          filters={filters}
          setFilters={setFilters}
          onApplyFilters={handleApplyFilters}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="rounded-lg bg-white shadow-sm p-4">
                <Skeleton className="aspect-square w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-3 w-2/3 mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-8 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-center">
            <p className="text-red-600 mb-4">
              Произошла ошибка при загрузке товаров: {error instanceof Error ? error.message : 'Неизвестная ошибка'}
            </p>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products?.length === 0 ? (
              <div className="col-span-full py-8 text-center text-gray-500">
                Товары не найдены
              </div>
            ) : (
              products?.map((product) => (
                <AdminProductCard
                  key={product.id}
                  product={product}
                  onDelete={handleDeleteProduct}
                  isDeleting={isDeleting && deleteProductId === product.id}
                  onStatusChange={() => {
                    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
                  }}
                  isSelected={selectedProducts.includes(product.id)}
                  onSelectToggle={handleToggleProductSelect}
                />
              ))
            )}
          </div>
        )}
        
        {/* Loading indicator and intersection observer target */}
        {hasNextPage && (
          <div 
            ref={loadMoreRef}
            className="w-full py-8 flex items-center justify-center"
          >
            {isFetchingNextPage ? (
              <div className="flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-t-blue-500 border-r-transparent border-l-transparent border-b-transparent rounded-full animate-spin"></div>
                <span className="ml-2">Загрузка...</span>
              </div>
            ) : (
              <div className="h-10"></div> // Empty space to trigger the intersection
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
