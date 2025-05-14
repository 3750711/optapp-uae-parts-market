
import React from 'react';
import { Product } from '@/types/product';
import AdminProductCard from '@/components/admin/AdminProductCard';
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductsGridProps {
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  searchError?: string | null;
  refetch: () => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  deleteProductId: string | null;
  onStatusChange: () => void;
}

const ProductsGrid: React.FC<ProductsGridProps> = ({
  products,
  isLoading,
  isError,
  error,
  searchError,
  refetch,
  onDelete,
  isDeleting,
  deleteProductId,
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

  if (isError || searchError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <div className="flex items-center justify-center mb-2 text-red-600">
          <AlertCircle className="h-6 w-6 mr-2" />
          <h3 className="text-lg font-semibold">Ошибка при загрузке товаров</h3>
        </div>
        <p className="text-red-600 mb-4">
          {searchError || (error instanceof Error ? error.message : 'Неизвестная ошибка')}
        </p>
        <Button 
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Попробовать снова
        </Button>
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
        />
      ))}
    </div>
  );
};

export default ProductsGrid;
