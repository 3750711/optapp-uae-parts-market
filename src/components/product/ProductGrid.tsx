
import React, { memo } from "react";
import ProductCard, { ProductProps } from "./ProductCard";
import ProductListItem from "./ProductListItem";
import ProductSkeleton from "@/components/catalog/ProductSkeleton";

export type ViewMode = 'grid' | 'list';

interface ProductGridProps {
  products: ProductProps[];
  isLoading?: boolean;
  showAllStatuses?: boolean;
  showSoldButton?: boolean;
  onStatusChange?: () => void;
  viewMode?: ViewMode;
}

const ProductGrid: React.FC<ProductGridProps> = ({ 
  products, 
  isLoading = false,
  showAllStatuses = false,
  showSoldButton = false,
  onStatusChange,
  viewMode = 'grid'
}) => {
  // Display loading skeleton when data is loading
  if (isLoading) {
    if (viewMode === 'list') {
      return (
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="bg-white border border-gray-100 rounded-lg p-4">
              <div className="flex gap-4">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                  <div className="flex justify-between pt-2">
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[400px] auto-rows-fr">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Товары не найдены
      </div>
    );
  }

  console.log(`ProductGrid rendering ${products.length} products in ${viewMode} mode`);

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {products.map((product) => (
          <MemoizedProductListItem
            key={product.id}
            product={product} 
            showSoldButton={showSoldButton}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[200px] auto-rows-fr">
      {products.map((product) => (
        <div key={product.id} className="flex min-h-0">
          <MemoizedProductCard 
            product={product} 
            showSoldButton={showSoldButton}
            onStatusChange={onStatusChange}
          />
        </div>
      ))}
    </div>
  );
};

// Memoize components to prevent unnecessary re-renders
const MemoizedProductCard = memo(ProductCard);
const MemoizedProductListItem = memo(ProductListItem);

export default memo(ProductGrid);
