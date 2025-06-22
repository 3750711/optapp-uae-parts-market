
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { ProductProps } from './ProductCard';
import ProductListItem from './ProductListItem';

interface VirtualizedProductListProps {
  products: ProductProps[];
  containerHeight?: number;
  itemHeight?: number;
  showSoldButton?: boolean;
  onStatusChange?: () => void;
}

const VirtualizedProductList: React.FC<VirtualizedProductListProps> = ({
  products,
  containerHeight = 600,
  itemHeight = 120,
  showSoldButton = false,
  onStatusChange
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
      <div style={style} className="px-2">
        <ProductListItem
          product={product}
          showSoldButton={showSoldButton}
          onStatusChange={onStatusChange}
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
  if (products.length <= 50) {
    return (
      <div className="space-y-3">
        {products.map((product) => (
          <ProductListItem
            key={product.id}
            product={product}
            showSoldButton={showSoldButton}
            onStatusChange={onStatusChange}
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
        overscanCount={5} // Render 5 extra items for smooth scrolling
      >
        {Row}
      </List>
    </div>
  );
};

export default VirtualizedProductList;
