
import React, { memo, useMemo, useState, useEffect } from "react";
import { FixedSizeGrid as Grid } from 'react-window';
import { useIsMobile } from "@/hooks/use-mobile";
import { useMobileLayout } from "@/hooks/useMobileLayout";
import ProductCard, { ProductProps } from "./ProductCard";
import ProductListItem from "./ProductListItem";
import MobileCatalogCard from "./MobileCatalogCard";
import VirtualizedProductList from "./VirtualizedProductList";
import ProductSkeleton from "@/components/catalog/ProductSkeleton";
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { BatchOfferData } from '@/hooks/use-price-offers-batch';

export type ViewMode = 'grid' | 'list' | 'virtualized';

interface UnifiedProductGridProps {
  products: ProductProps[];
  isLoading?: boolean;
  showAllStatuses?: boolean;
  showSoldButton?: boolean;
  onStatusChange?: () => void;
  onRepostSuccess?: () => void; // Add repost callback
  viewMode?: ViewMode;
  containerHeight?: number;
  batchOffersData?: BatchOfferData[];
  useSimpleOfferButton?: boolean;
}

const UnifiedProductGrid: React.FC<UnifiedProductGridProps> = ({ 
  products, 
  isLoading = false,
  showAllStatuses = false,
  showSoldButton = false,
  onStatusChange,
  onRepostSuccess,
  viewMode = 'list',
  containerHeight = 600,
  batchOffersData,
  useSimpleOfferButton = false
}) => {
  const isMobile = useIsMobile();
  const { isMobile: isMobileLayout } = useMobileLayout();
  const { isAdmin } = useAdminAccess();
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  
  // Handle window resize for virtualized mode
  useEffect(() => {
    if (viewMode !== 'virtualized') return;
    
    const handleResize = () => {
      setContainerWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Filter products based on status and admin privileges
  const visibleProducts = useMemo(() => {
    return products.filter(product => {
      if (showAllStatuses || isAdmin) {
        return true;
      }
      return product.status === 'active' || product.status === 'sold';
    });
  }, [products, showAllStatuses, isAdmin]);

  // Calculate grid dimensions for virtualized mode
  const { columnCount, columnWidth, rowHeight, gridWidth } = useMemo(() => {
    if (viewMode !== 'virtualized') return {};
    
    if (isMobile) {
      const width = containerWidth - 24;
      return {
        columnCount: 2,
        columnWidth: width / 2,
        rowHeight: 320,
        gridWidth: width
      };
    } else {
      const width = containerWidth - 100;
      const minCardWidth = 280;
      const cols = Math.floor(width / minCardWidth);
      const finalCols = Math.max(2, Math.min(4, cols));
      return {
        columnCount: finalCols,
        columnWidth: width / finalCols,
        rowHeight: 380,
        gridWidth: width
      };
    }
  }, [isMobile, containerWidth, viewMode]);

  // Display loading skeleton when data is loading
  if (isLoading) {
    if (viewMode === 'list') {
      return (
        <div className="space-y-3">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="bg-white border border-gray-100 rounded-lg p-3">
              <div className="flex gap-3">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                  <div className="flex justify-between pt-1">
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-1/4" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
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

  if (visibleProducts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Товары не найдены
      </div>
    );
  }

  // For large datasets, use virtualized list for better performance
  if (viewMode === 'list' && visibleProducts.length > 50) {
    return (
      <VirtualizedProductList
        products={visibleProducts}
        containerHeight={containerHeight}
        showSoldButton={showSoldButton}
        onStatusChange={onStatusChange}
        batchOffersData={batchOffersData}
        useSimpleOfferButton={useSimpleOfferButton}
      />
    );
  }

  // Virtualized grid mode
  if (viewMode === 'virtualized') {
    const rowCount = Math.ceil(visibleProducts.length / (columnCount || 1));

    const Cell = ({ columnIndex, rowIndex, style }: any) => {
      const productIndex = rowIndex * (columnCount || 1) + columnIndex;
      const product = visibleProducts[productIndex];
      
      if (!product) return null;

      return (
        <div style={style} className="p-2">
           <ProductCard 
            product={product}
            showSoldButton={showSoldButton}
            onStatusChange={onStatusChange}
            onRepostSuccess={onRepostSuccess}
            batchOffersData={batchOffersData}
            useSimpleOfferButton={useSimpleOfferButton}
          />
        </div>
      );
    };

    return (
      <div className="w-full">
        <Grid
          columnCount={columnCount || 1}
          columnWidth={columnWidth || 300}
          height={containerHeight}
          rowCount={rowCount}
          rowHeight={rowHeight || 380}
          width={gridWidth || containerWidth}
          className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          overscanColumnCount={2}
          overscanRowCount={2}
        >
          {Cell}
        </Grid>
      </div>
    );
  }

  // List view mode
  if (viewMode === 'list') {
    // Mobile layout uses MobileCatalogCard
    if (isMobileLayout) {
      return (
        <div className="space-y-3">
          {visibleProducts.map((product) => (
            <MobileCatalogCard
              key={product.id}
              product={product}
              showSoldButton={showSoldButton}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      );
    }
    
    // Desktop layout uses ProductListItem
    return (
      <div className="space-y-3">
         {visibleProducts.map((product) => (
           <ProductListItem
             key={product.id}
             product={product} 
             batchOffersData={batchOffersData}
             showSoldButton={showSoldButton}
             onStatusChange={onStatusChange}
             onRepostSuccess={onRepostSuccess}
           />
         ))}
      </div>
    );
  }

  // Grid view mode
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[200px] auto-rows-fr">
      {visibleProducts.map((product) => (
        <div key={product.id} className="flex min-h-0">
           <ProductCard 
            product={product} 
            showSoldButton={showSoldButton}
            onStatusChange={onStatusChange}
            onRepostSuccess={onRepostSuccess}
            batchOffersData={batchOffersData}
            useSimpleOfferButton={useSimpleOfferButton}
          />
        </div>
      ))}
    </div>
  );
};

export default memo(UnifiedProductGrid);
