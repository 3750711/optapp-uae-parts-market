
import React from 'react';
import { Product } from '@/types/product';
import AdminProductCard from '@/components/admin/AdminProductCard';
import { Skeleton } from "@/components/ui/skeleton";

interface ProductsGridProps {
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  deleteProductId: string | null;
  selectedProducts: string[];
  onSelectToggle: (productId: string) => void;
  onStatusChange: () => void;
}

const ProductsGrid: React.FC<ProductsGridProps> = ({
  products,
  isLoading,
  isError,
  error,
  refetch,
  onDelete,
  isDeleting,
  deleteProductId,
  selectedProducts,
  onSelectToggle,
  onStatusChange,
}) => {
  if (isLoading) {
    return (
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
    );
  }

  if (isError) {
    return (
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
    );
  }

  if (products?.length === 0) {
    return (
      <div className="col-span-full py-8 text-center text-gray-500">
        Товары не найдены
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products?.map((product) => (
        <AdminProductCard
          key={product.id}
          product={product}
          onDelete={onDelete}
          isDeleting={isDeleting && deleteProductId === product.id}
          onStatusChange={onStatusChange}
          isSelected={selectedProducts.includes(product.id)}
          onSelectToggle={onSelectToggle}
        />
      ))}
    </div>
  );
};

export default ProductsGrid;
