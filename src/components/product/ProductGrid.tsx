import React from "react";
import ProductCard, { ProductProps } from "./ProductCard";
import { useAdminAccess } from "@/hooks/useAdminAccess";

interface ProductGridProps {
  products: ProductProps[];
  showAllStatuses?: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, showAllStatuses = false }) => {
  const { isAdmin } = useAdminAccess();
  
  // Filter products based on status and admin privileges
  const visibleProducts = products.filter(product => {
    // If showing all statuses is enabled or user is admin, show all products
    if (showAllStatuses || isAdmin) {
      return true;
    }
    
    // Otherwise only show active and sold products in the grid
    return product.status === 'active' || product.status === 'sold';
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {visibleProducts.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  );
};

export default ProductGrid;
