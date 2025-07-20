
import React, { useMemo } from "react";
import ProductCard, { ProductProps } from "@/components/product/ProductCard";

// View mode type definition
type ViewMode = "grid" | "list";
import { useBatchOffers } from "@/hooks/use-price-offers-batch";
import { useGlobalRealTimePriceOffers } from "@/hooks/use-price-offers-realtime-optimized";
import { useAuth } from "@/contexts/AuthContext";

interface OptimizedProductGridProps {
  products: ProductProps[];
  viewMode?: ViewMode;
  onStatusChange?: (productId: string, newStatus: string) => void;
  showSoldButton?: boolean;
  disableCarousel?: boolean;
  hideMakeOfferButton?: boolean;
}

export const OptimizedProductGrid = React.memo(({
  products,
  viewMode = "grid",
  onStatusChange,
  showSoldButton = false,
  disableCarousel = false,
  hideMakeOfferButton = false,
}: OptimizedProductGridProps) => {
  const { user } = useAuth();
  
  // Extract product IDs for batch fetching
  const productIds = useMemo(() => 
    products.map(product => product.id).filter(Boolean),
    [products]
  );

  // Set up global real-time subscription for all offers
  useGlobalRealTimePriceOffers({ 
    enabled: productIds.length > 0 && !!user,
    userId: user?.id 
  });

  // Batch fetch offer data for all products
  const { data: batchOfferData, isLoading: isBatchLoading, error: batchError } = useBatchOffers(
    productIds,
    !hideMakeOfferButton && !!user
  );

  console.log('🔄 OptimizedProductGrid batch data:', {
    productCount: products.length,
    batchDataCount: batchOfferData?.length || 0,
    isLoading: isBatchLoading,
    hasError: !!batchError,
    productIds: productIds.slice(0, 5), // Log first 5 for debugging
    sampleBatchData: batchOfferData?.slice(0, 3) // Log first 3 items for debugging
  });

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
              batchOfferData={batchOfferData}
              useFallbackQueries={!batchOfferData || batchError}
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
          batchOfferData={batchOfferData}
          useFallbackQueries={!batchOfferData || batchError}
        />
      ))}
    </div>
  );
});

OptimizedProductGrid.displayName = "OptimizedProductGrid";
