
import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductsGrid from '@/components/admin/productGrid/ProductsGrid';
import LoadMoreTrigger from '@/components/admin/productGrid/LoadMoreTrigger';
import ProductSearchAndFilters from '@/components/admin/ProductSearchAndFilters';
import SelectedProductsActions from '@/components/admin/filters/SelectedProductsActions';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  created_at: string;
  title: string;
  price: number;
  status: string;
  [key: string]: any;
}

interface DateRange {
  from: Date | null;
  to: Date | null;
}

const PAGE_SIZE = 12;

const AdminProducts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const fetchProducts = useCallback(async ({ pageParam = 1 }) => {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((pageParam - 1) * PAGE_SIZE, pageParam * PAGE_SIZE - 1);

    if (searchTerm) {
      query = query.ilike('title', `%${searchTerm}%`);
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (dateRange.from) {
      query = query.gte('created_at', dateRange.from.toISOString());
    }

    if (dateRange.to) {
      query = query.lte('created_at', dateRange.to.toISOString());
    }

    if (priceRange.min > 0) {
      query = query.gte('price', priceRange.min);
    }

    if (priceRange.max < 100000) {
      query = query.lte('price', priceRange.max);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    setHasNextPage(pageParam < totalPages);

    return { data, totalPages };
  }, [searchTerm, statusFilter, dateRange, priceRange]);

  const {
    data,
    isLoading,
    refetch,
    isError,
    error,
  } = useQuery({
    queryKey: ['products', searchTerm, statusFilter, dateRange, priceRange, currentPage],
    queryFn: () => fetchProducts({ pageParam: 1 }),
  });

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateRange, priceRange]);

  const handleBulkStatusChange = async (status: string) => {
    if (selectedProducts.length === 0) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ status })
        .in('id', selectedProducts);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: `Статус ${selectedProducts.length} товаров изменен на "${status}"`,
      });

      setSelectedProducts([]);
      refetch();
    } catch (error) {
      console.error('Error updating products:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус товаров",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', selectedProducts);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: `${selectedProducts.length} товаров удалено`,
      });

      setSelectedProducts([]);
      refetch();
    } catch (error) {
      console.error('Error deleting products:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить товары",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = useMemo(() => {
    return data?.data || [];
  }, [data]);

  const loadMore = async () => {
    if (isLoadingMore || !hasNextPage) return;
    setIsLoadingMore(true);
    setCurrentPage(prev => prev + 1);

    try {
      const nextPageData = await fetchProducts({ pageParam: currentPage + 1 });
      if (nextPageData) {
        setHasNextPage(currentPage + 1 < nextPageData.totalPages);
      }
    } catch (error) {
      console.error("Failed to load more products", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({ from: null, to: null });
    setPriceRange({ min: 0, max: 100000 });
  };

  const handleDelete = (id: string) => {
    // Implementation for single product delete
    console.log('Delete product:', id);
  };

  const handleStatusChange = () => {
    refetch();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">Управление товарами</h1>
          <Button 
            onClick={() => navigate('/admin/add-product')}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить товар
          </Button>
        </div>

        {/* Search and Filters */}
        <ProductSearchAndFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          clearFilters={clearFilters}
          isLoading={isLoading}
        />

        {/* Selected Products Actions */}
        {selectedProducts.length > 0 && (
          <SelectedProductsActions
            selectedCount={selectedProducts.length}
            onStatusChange={handleBulkStatusChange}
            onDelete={handleBulkDelete}
            onClearSelection={() => setSelectedProducts([])}
          />
        )}

        {/* Products Grid */}
        <ProductsGrid
          products={filteredProducts}
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
          onDelete={handleDelete}
          isDeleting={false}
          deleteProductId={null}
          onStatusChange={handleStatusChange}
        />
        
        {hasNextPage && (
          <LoadMoreTrigger
            hasNextPage={hasNextPage}
            isFetchingNextPage={isLoadingMore}
            innerRef={React.createRef()}
            onLoadMore={loadMore}
          />
        )}

        {/* Empty State */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">Товары не найдены</div>
            <div className="text-gray-400">
              {searchTerm || statusFilter !== 'all' || dateRange.from || dateRange.to 
                ? 'Попробуйте изменить фильтры поиска'
                : 'Начните с добавления первого товара'
              }
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
