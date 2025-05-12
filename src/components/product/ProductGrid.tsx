
import React, { memo } from "react";
import ProductCard, { ProductProps } from "./ProductCard";
import { useAdminAccess } from "@/hooks/useAdminAccess";

interface ProductGridProps {
  products: ProductProps[];
  showAllStatuses?: boolean;
  isLoading?: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, showAllStatuses = false, isLoading = false }) => {
  const { isAdmin } = useAdminAccess();
  
  // Filter products based on status and admin privileges
  const visibleProducts = React.useMemo(() => {
    return products.filter(product => {
      // If showing all statuses is enabled or user is admin, show all products
      if (showAllStatuses || isAdmin) {
        return true;
      }
      
      // Otherwise only show active and sold products in the grid
      return product.status === 'active' || product.status === 'sold';
    });
  }, [products, showAllStatuses, isAdmin]);

  // Display loading skeleton when data is loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {visibleProducts.map((product) => (
        <MemoizedProductCard key={product.id} {...product} />
      ))}
    </div>
  );
};

// Import ProductSkeleton component for loading states
import ProductSkeleton from "@/components/catalog/ProductSkeleton";

// Memoize ProductCard to prevent unnecessary re-renders
const MemoizedProductCard = memo(ProductCard);

export default memo(ProductGrid);
