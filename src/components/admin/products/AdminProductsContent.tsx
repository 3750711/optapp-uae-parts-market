
import React from 'react';
import ProductsGrid from '@/components/admin/productGrid/ProductsGrid';
import LoadMoreTrigger from '@/components/admin/productGrid/LoadMoreTrigger';
import { Product } from '@/types/product';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Search } from 'lucide-react';

interface AdminProductsContentProps {
  products: Product[];
  selectedProducts: string[];
  onProductSelect: (products: string[]) => void;
  onProductUpdate: () => void;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  searchTerm: string;
  debouncedSearchTerm?: string;
  statusFilter: string;
  sellerFilter: string;
  hasActiveFilters?: boolean;
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
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  searchTerm,
  debouncedSearchTerm,
  statusFilter,
  sellerFilter,
  hasActiveFilters = false
}) => {
  console.log('📦 AdminProductsContent render:', { 
    productsCount: products.length,
    isLoading,
    isError,
    hasActiveFilters,
    searchTerm,
    debouncedSearchTerm 
  });

  // Показываем ошибку, если есть проблемы с загрузкой
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            Ошибка загрузки товаров: {error instanceof Error ? error.message : 'Неизвестная ошибка'}
          </span>
          <button 
            onClick={() => refetch()}
            className="ml-2 text-sm underline hover:no-underline"
          >
            Повторить
          </button>
        </AlertDescription>
      </Alert>
    );
  }

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
        onDelete={() => {}} // Handled in AdminProductCard
        isDeleting={false}
        deleteProductId={null}
        onStatusChange={onProductUpdate}
      />
      
      {/* Load More Trigger */}
      {hasNextPage && !isLoading && (
        <LoadMoreTrigger
          onLoadMore={() => fetchNextPage()}
          isLoading={isFetchingNextPage}
          hasNextPage={hasNextPage}
        />
      )}

      {/* Empty State */}
      {!isLoading && products.length === 0 && (
        <div className="text-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <Search className="h-12 w-12 text-gray-300" />
            <div className="text-gray-500 text-lg mb-2">
              {hasActiveFilters ? 'Товары не найдены' : 'Нет товаров'}
            </div>
            <div className="text-gray-400 max-w-md">
              {hasActiveFilters 
                ? 'Попробуйте изменить параметры поиска или фильтры'
                : 'Начните с добавления первого товара в каталог'
              }
            </div>
            {debouncedSearchTerm && (
              <div className="text-sm text-gray-500 mt-2">
                Поиск по запросу: "<span className="font-medium">{debouncedSearchTerm}</span>"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsContent;
