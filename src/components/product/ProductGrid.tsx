
import React from "react";
import UnifiedProductGrid, { ViewMode } from "./UnifiedProductGrid";
import { ProductProps } from "./ProductCard";
import { BatchOfferData } from '@/hooks/use-price-offers-batch';

interface ProductGridProps {
  products: ProductProps[];
  isLoading?: boolean;
  showAllStatuses?: boolean;
  showSoldButton?: boolean;
  onStatusChange?: () => void;
  viewMode?: ViewMode;
  batchOffersData?: BatchOfferData[];
}

const ProductGrid: React.FC<ProductGridProps> = (props) => {
  return <UnifiedProductGrid {...props} />;
};

export default ProductGrid;
