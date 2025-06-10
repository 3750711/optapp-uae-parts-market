
import React, { useState, useMemo, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
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
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const fetchProducts = useCallback(async ({ pageParam = 0 }) => {
    let query = supabase
      .from('products')
      .select(`
        *,
        product_images(id, url, is_primary)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

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
  }, [searchTerm, statusFilter, dateRange, priceRange]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['products', searchTerm, statusFilter, dateRange, priceRange],
    queryFn: fetchProducts,
    getNextPageParam: (lastPage, allPages) => {
      const totalItems = allPages.reduce((sum, page) => sum + page.data.length, 0);
      const totalCount = lastPage.count;
      return totalItems < totalCount ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });

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

    setIsDeleting(true);
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
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteProductId(id);
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Товар удален",
      });

      refetch();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить товар",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteProductId(null);
    }
  };

  const handleStatusChange = () => {
    refetch();
  };

  const allProducts = useMemo(() => {
    return data?.pages.flatMap(page => page.data) || [];
  }, [data]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({ from: null, to: null });
    setPriceRange({ min: 0, max: 100000 });
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
        <SelectedProductsActions
          selectedCount={selectedProducts.length}
          onStatusChange={handleBulkStatusChange}
          onDelete={handleBulkDelete}
          onClearSelection={() => setSelectedProducts([])}
        />

        {/* Products Grid */}
        <ProductsGrid
          products={allProducts}
          selectedProducts={selectedProducts}
          onProductSelect={setSelectedProducts}
          onProductUpdate={refetch}
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
          onDelete={handleDelete}
          isDeleting={isDeleting}
          deleteProductId={deleteProductId}
          onStatusChange={handleStatusChange}
        />
        
        {hasNextPage && (
          <LoadMoreTrigger
            onLoadMore={() => fetchNextPage()}
            isLoading={isFetchingNextPage}
            hasNextPage={hasNextPage}
          />
        )}

        {/* Empty State */}
        {!isLoading && allProducts.length === 0 && (
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
