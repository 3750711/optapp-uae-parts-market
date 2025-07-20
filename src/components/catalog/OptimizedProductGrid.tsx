
import React, { useMemo } from "react";
import ProductCard, { ProductProps } from "@/components/product/ProductCard";
import { BatchOfferData } from "@/hooks/use-price-offers-batch";

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

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {products.map((product) => (
          <div key={product.id} className="w-full">
            <ProductCard
              product={product}
              onStatusChange={onStatusChange}
              showSoldButton={showSoldButton}
              disableCarousel={disableCarousel}
              hideMakeOfferButton={hideMakeOfferButton}
              batchOffersData={batchOffersData}
            />
          </div>
        ))}
      </div>
    );
  }

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
