import React, { useMemo } from "react";
import ProductCard, { ProductProps } from "@/components/product/ProductCard";
import OptimizedMobileCatalogCard from "@/components/product/OptimizedMobileCatalogCard";
import { BatchOfferData } from "@/hooks/use-price-offers-batch";
import { useMobileLayout } from "@/hooks/useMobileLayout";

// View mode type definition
type ViewMode = "grid" | "list";
import { useAuth } from "@/contexts/AuthContext";

interface OptimizedProductGridProps {
  products: ProductProps[];
  viewMode?: ViewMode;
  onStatusChange?: (productId: string, newStatus: string) => void;
  showSoldButton?: boolean;
  disableCarousel?: boolean;
  hideMakeOfferButton?: boolean;
  batchOffersData?: BatchOfferData[];
}

export const OptimizedProductGrid = React.memo(({
  products,
  viewMode = "grid",
  onStatusChange,
  showSoldButton = false,
  disableCarousel = false,
  hideMakeOfferButton = false,
  batchOffersData,
}: OptimizedProductGridProps) => {
  const { isMobile } = useMobileLayout();

  // На мобильных или в list view используем OptimizedMobileCatalogCard
  if (isMobile || viewMode === "list") {
    return (
      <div className="space-y-3">
        {products.map((product) => (
          <OptimizedMobileCatalogCard
            key={product.id}
            product={product}
            onStatusChange={onStatusChange}
            showSoldButton={showSoldButton}
          />
        ))}
      </div>
    );
  }

  // Desktop grid view
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onStatusChange={onStatusChange}
          showSoldButton={showSoldButton}
          disableCarousel={disableCarousel}
          hideMakeOfferButton={hideMakeOfferButton}
          batchOffersData={batchOffersData}
        />
      ))}
    </div>
  );
});

OptimizedProductGrid.displayName = "OptimizedProductGrid";
