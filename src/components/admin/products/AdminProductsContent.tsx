
import React from 'react';
import ProductsGrid from '@/components/admin/productGrid/ProductsGrid';
import LoadMoreTrigger from '@/components/admin/productGrid/LoadMoreTrigger';
import { Product } from '@/types/product';

interface AdminProductsContentProps {
  products: Product[];
  selectedProducts: string[];
  onProductSelect: (products: string[]) => void;
  onProductUpdate: () => void;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  deleteProductId: string | null;
  onStatusChange: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  searchTerm: string;
  statusFilter: string;
  dateRange: { from: Date | null; to: Date | null };
  priceRange: { min: number; max: number };
}

const AdminProductsContent: React.FC<AdminProductsContentProps> = ({
  products,
  selectedProducts,
  onProductSelect,
  onProductUpdate,
  isLoading,
  isError,
  error,
  refetch,
  onDelete,
  isDeleting,
  deleteProductId,
  onStatusChange,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  searchTerm,
  statusFilter,
  dateRange,
  priceRange
}) => {
  return (
    <div className="space-y-6">
      {/* Products Grid */}
      <ProductsGrid
        products={products}
        selectedProducts={selectedProducts}
        onProductSelect={onProductSelect}
        onProductUpdate={onProductUpdate}
        isLoading={isLoading}
        isError={isError}
        error={error}
        refetch={refetch}
        onDelete={onDelete}
        isDeleting={isDeleting}
        deleteProductId={deleteProductId}
        onStatusChange={onStatusChange}
      />
      
      {hasNextPage && (
        <LoadMoreTrigger
          onLoadMore={() => fetchNextPage()}
          isLoading={isFetchingNextPage}
          hasNextPage={hasNextPage}
        />
      )}

      {/* Empty State */}
      {!isLoading && products.length === 0 && (
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
  );
};

export default AdminProductsContent;
