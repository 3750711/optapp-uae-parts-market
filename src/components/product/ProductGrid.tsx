
import React, { memo } from "react";
import ProductCard, { ProductProps } from "./ProductCard";
import ProductSkeleton from "@/components/catalog/ProductSkeleton";

interface ProductGridProps {
  products: ProductProps[];
  isLoading?: boolean;
  showAllStatuses?: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({ 
  products, 
  isLoading = false,
  showAllStatuses = false 
}) => {
  // Display loading skeleton when data is loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[400px] auto-rows-fr">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  // No filtering here - all filtering is now handled in useCatalogProducts
  if (products.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[200px]">
        <div className="col-span-full text-center py-12 text-gray-500">
          Товары не найдены
        </div>
      </div>
    );
  }

  console.log(`ProductGrid rendering ${products.length} products`);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[200px] auto-rows-fr">
      {products.map((product) => (
        <div key={product.id} className="flex min-h-0">
          <MemoizedProductCard product={product} />
        </div>
      ))}
    </div>
  );
};

// Memoize ProductCard to prevent unnecessary re-renders
const MemoizedProductCard = memo(ProductCard);

export default memo(ProductGrid);
