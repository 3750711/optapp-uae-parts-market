
import React, { useState, useMemo, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminProductsHeader from '@/components/admin/products/AdminProductsHeader';
import AdminProductsFilters from '@/components/admin/products/AdminProductsFilters';
import AdminProductsContent from '@/components/admin/products/AdminProductsContent';
import AdminProductsActions from '@/components/admin/products/AdminProductsActions';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

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

  // Use the actions hook
  const { handleBulkStatusChange, handleBulkDelete } = AdminProductsActions({
    selectedProducts,
    setSelectedProducts,
    refetch
  });

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
        <AdminProductsHeader />

        <AdminProductsFilters
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
          selectedProducts={selectedProducts}
          onBulkStatusChange={handleBulkStatusChange}
          onBulkDelete={handleBulkDelete}
          onClearSelection={() => setSelectedProducts([])}
        />

        <AdminProductsContent
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
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          dateRange={dateRange}
          priceRange={priceRange}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
