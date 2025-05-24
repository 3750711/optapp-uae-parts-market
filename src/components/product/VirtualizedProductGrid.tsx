
import React, { useMemo, useState, useEffect } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { useIsMobile } from '@/hooks/use-mobile';
import ProductCard, { ProductProps } from './ProductCard';
import { useAdminAccess } from '@/hooks/useAdminAccess';

interface VirtualizedProductGridProps {
  products: ProductProps[];
  showAllStatuses?: boolean;
  containerHeight?: number;
}

const VirtualizedProductGrid: React.FC<VirtualizedProductGridProps> = ({ 
  products, 
  showAllStatuses = false,
  containerHeight = 600
}) => {
  const isMobile = useIsMobile();
  const { isAdmin } = useAdminAccess();
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter products based on status and admin privileges
  const visibleProducts = useMemo(() => {
    return products.filter(product => {
      if (showAllStatuses || isAdmin) {
        return true;
      }
      return product.status === 'active' || product.status === 'sold';
    });
  }, [products, showAllStatuses, isAdmin]);

  // Calculate grid dimensions
  const { columnCount, columnWidth, rowHeight, gridWidth } = useMemo(() => {
    if (isMobile) {
      const width = containerWidth - 24; // Account for padding
      return {
        columnCount: 2,
        columnWidth: Math.floor(width / 2),
        rowHeight: 320,
        gridWidth: width
      };
    } else {
      const width = containerWidth - 100; // Account for padding
      const minCardWidth = 280;
      const cols = Math.floor(width / minCardWidth);
      const finalCols = Math.max(2, Math.min(4, cols));
      return {
        columnCount: finalCols,
        columnWidth: Math.floor(width / finalCols),
        rowHeight: 380,
        gridWidth: width
      };
    }
  }, [isMobile, containerWidth]);

  const rowCount = Math.ceil(visibleProducts.length / columnCount);

  // Cell renderer
  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const productIndex = rowIndex * columnCount + columnIndex;
    const product = visibleProducts[productIndex];
    
    if (!product) return null;

    return (
      <div style={style} className="p-2">
        <ProductCard product={product} />
      </div>
    );
  };

  if (visibleProducts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Товары не найдены
      </div>
    );
  }

  return (
    <div className="w-full">
      <Grid
        columnCount={columnCount}
        columnWidth={columnWidth}
        height={containerHeight}
        rowCount={rowCount}
        rowHeight={rowHeight}
        width={gridWidth}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {Cell}
      </Grid>
    </div>
  );
};

export default VirtualizedProductGrid;
