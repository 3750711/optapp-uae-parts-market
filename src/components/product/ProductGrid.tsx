
import React from "react";
import UnifiedProductGrid, { ViewMode } from "./UnifiedProductGrid";
import { ProductProps } from "./ProductCard";

interface ProductGridProps {
  products: ProductProps[];
  isLoading?: boolean;
  showAllStatuses?: boolean;
  showSoldButton?: boolean;
  onStatusChange?: () => void;
  viewMode?: ViewMode;
}

const ProductGrid: React.FC<ProductGridProps> = (props) => {
  return <UnifiedProductGrid {...props} />;
};

export default ProductGrid;
