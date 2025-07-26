
import React, { memo } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import ProductListItem from './ProductListItem';
import { ProductProps } from './ProductCard';
import { BatchOfferData } from '@/hooks/use-price-offers-batch';

interface VirtualizedProductListProps {
  products: ProductProps[];
  containerHeight: number;
  showSoldButton?: boolean;
  onStatusChange?: (productId: string, newStatus: string) => void;
  batchOffersData?: BatchOfferData[];
  useSimpleOfferButton?: boolean;
}

const VirtualizedProductList: React.FC<VirtualizedProductListProps> = memo(({
  products,
  containerHeight,
  showSoldButton = false,
  onStatusChange,
  batchOffersData,
  useSimpleOfferButton = false,
}) => {
  const ItemRenderer = memo(({ index, style }: ListChildComponentProps) => {
    const product = products[index];
    
    return (
      <div style={style}>
        <div className="px-2 py-1">
          <ProductListItem
            product={product}
            batchOffersData={batchOffersData}
            showSoldButton={showSoldButton}
            onStatusChange={onStatusChange}
          />
        </div>
      </div>
    );
  });

  ItemRenderer.displayName = "VirtualizedProductListItem";

  return (
    <List
      height={containerHeight}
      width="100%"
      itemCount={products.length}
      itemSize={140}
      className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      overscanCount={5}
    >
      {ItemRenderer}
    </List>
  );
});

VirtualizedProductList.displayName = "VirtualizedProductList";

export default VirtualizedProductList;
