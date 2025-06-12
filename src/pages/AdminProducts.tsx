
import React, { useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminProductsHeader from '@/components/admin/products/AdminProductsHeader';
import AdminProductsFilters from '@/components/admin/products/AdminProductsFilters';
import AdminProductsContent from '@/components/admin/products/AdminProductsContent';
import { AdminProductsErrorBoundary } from '@/components/error/AdminProductsErrorBoundary';
import { useEnhancedProductsState } from '@/hooks/useEnhancedProductsState';
import { useAdminProductsActions } from '@/hooks/useAdminProductsActions';
import { useIsMobile } from '@/hooks/use-mobile';

const AdminProducts = () => {
  const isMobile = useIsMobile();
  
  // Enhanced state management with error handling
  const {
    products,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    updateSearchTerm,
    clearSearch,
    hasActiveSearch,
    statusFilter,
    setStatusFilter,
    sellerFilter,
    setSellerFilter,
    selectedProducts,
    setSelectedProducts,
    clearFilters,
    hasActiveFilters
  } = useEnhancedProductsState();

  // Enhanced actions with error handling
  const { 
    handleBulkStatusChange, 
    handleBulkDelete,
    isDeleting 
  } = useAdminProductsActions({
    selectedProducts,
    setSelectedProducts,
    refetch
  });

  // Extract unique sellers from products
  const sellers = useMemo(() => {
    const uniqueSellers = new Map();
    products.forEach(product => {
      if (product.seller_id && product.seller_name) {
        uniqueSellers.set(product.seller_id, {
          id: product.seller_id,
          name: product.seller_name
        });
      }
    });
    return Array.from(uniqueSellers.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  console.log('🎯 AdminProducts render:', { 
    productsCount: products.length,
    isLoading,
    searchTerm,
    debouncedSearchTerm,
    isSearching 
  });

  return (
    <AdminProductsErrorBoundary>
      <AdminLayout>
        <div className="space-y-6">
          <AdminProductsHeader />

          <AdminProductsFilters
            searchTerm={searchTerm}
            setSearchTerm={updateSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sellerFilter={sellerFilter}
            setSellerFilter={setSellerFilter}
            sellers={sellers}
            clearFilters={clearFilters}
            isLoading={isLoading}
            isSearching={isSearching}
            hasActiveSearch={hasActiveSearch}
            hasActiveFilters={hasActiveFilters}
            selectedProducts={selectedProducts}
            onBulkStatusChange={handleBulkStatusChange}
            onBulkDelete={handleBulkDelete}
            onClearSelection={() => setSelectedProducts([])}
          />

          <AdminProductsContent
            products={products}
            selectedProducts={selectedProducts}
            onProductSelect={setSelectedProducts}
            onProductUpdate={refetch}
            isLoading={isLoading}
            isError={isError}
            error={error}
            refetch={refetch}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            searchTerm={searchTerm}
            debouncedSearchTerm={debouncedSearchTerm}
            statusFilter={statusFilter}
            sellerFilter={sellerFilter}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      </AdminLayout>
    </AdminProductsErrorBoundary>
  );
};

export default AdminProducts;
