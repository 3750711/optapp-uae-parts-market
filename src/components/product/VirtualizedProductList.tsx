
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { ProductProps } from './ProductCard';
import ProductListItem from './ProductListItem';
import { BatchOfferData } from '@/hooks/use-price-offers-batch';

interface VirtualizedProductListProps {
  products: ProductProps[];
  containerHeight?: number;
  itemHeight?: number;
  showSoldButton?: boolean;
  onStatusChange?: () => void;
  batchOffersData?: BatchOfferData[];
}

const VirtualizedProductList: React.FC<VirtualizedProductListProps> = ({
  products,
  containerHeight = 600,
  itemHeight = 200, // Increased height to accommodate new content
  showSoldButton = false,
  onStatusChange,
  batchOffersData
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const Row = React.memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const product = products[index];
    
    if (!product) return null;

    return (
      <div style={style} className="px-2 py-1">
        <ProductListItem
          product={product}
          showSoldButton={showSoldButton}
          onStatusChange={onStatusChange}
          batchOffersData={batchOffersData}
        />
      </div>
    );
  });

  Row.displayName = 'VirtualizedRow';

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Товары не найдены
      </div>
    );
  }

  // For small lists, use regular rendering
  if (products.length <= 30) { // Reduced threshold due to increased item height
    return (
      <div className="space-y-3">
        {products.map((product) => (
          <ProductListItem
            key={product.id}
            product={product}
            showSoldButton={showSoldButton}
            onStatusChange={onStatusChange}
            batchOffersData={batchOffersData}
          />
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <List
        height={containerHeight}
        width={containerWidth}
        itemCount={products.length}
        itemSize={itemHeight}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        overscanCount={3} // Reduced due to larger items
      >
        {Row}
      </List>
    </div>
  );
};

export default VirtualizedProductList;
