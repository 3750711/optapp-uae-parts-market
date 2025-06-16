
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { Product } from '@/types/product';
import AdminProductCard from '@/components/admin/AdminProductCard';
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ProductsGridProps {
  products: Product[];
  selectedProducts: string[];
  onProductSelect: React.Dispatch<React.SetStateAction<string[]>>;
  onProductUpdate: () => void;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  searchError?: string | null;
  refetch: () => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  deleteProductId: string | null;
  onStatusChange: () => void;
}

const CARD_WIDTH = 230;
const CARD_HEIGHT = 425;
const GAP = 12;

const ProductsGrid: React.FC<ProductsGridProps> = ({
  products,
  selectedProducts,
  onProductSelect,
  onProductUpdate,
  isLoading,
  isError,
  error,
  searchError,
  refetch,
  onDelete,
  isDeleting,
  deleteProductId,
  onStatusChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  // All hooks must be at the top - before any conditional returns
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Memoized callback with stable dependencies
  const handleProductSelect = useCallback((productId: string) => {
    onProductSelect((prevSelected) => {
      if (prevSelected.includes(productId)) {
        return prevSelected.filter((id) => id !== productId);
      } else {
        return [...prevSelected, productId];
      }
    });
  }, [onProductSelect]);

  // Calculate grid dimensions - always called, regardless of rendering conditions
  const gridDimensions = useMemo(() => {
    const { columnCount, rowCount } = (() => {
      const cols = Math.max(1, Math.floor(containerWidth / (CARD_WIDTH + GAP)));
      const rows = Math.ceil(products.length / cols);
      return { columnCount: cols, rowCount: rows };
    })();
    
    return { columnCount, rowCount };
  }, [products.length, containerWidth]);

  // Memoized Cell component for virtualization
  const Cell = useMemo(() => {
    return React.memo(({ columnIndex, rowIndex, style }: any) => {
      const index = rowIndex * gridDimensions.columnCount + columnIndex;
      const product = products[index];

      if (!product) return null;

      return (
        <div style={{
          ...style,
          padding: GAP / 2,
          top: `${parseFloat(style.top) + GAP / 2}px`,
          left: `${parseFloat(style.left) + GAP / 2}px`,
          width: `${parseFloat(style.width) - GAP}px`,
          height: `${parseFloat(style.height) - GAP}px`,
        }}>
          <AdminProductCard
            product={product}
            isSelected={selectedProducts.includes(product.id)}
            onSelect={() => handleProductSelect(product.id)}
            onDelete={onDelete}
            isDeleting={isDeleting && deleteProductId === product.id}
            onStatusChange={onStatusChange}
          />
        </div>
      );
    });
  }, [products, selectedProducts, handleProductSelect, onDelete, isDeleting, deleteProductId, onStatusChange, gridDimensions.columnCount]);

  // Now safe to do conditional rendering after all hooks are called
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={`skeleton-${index}`} className="rounded-lg bg-white shadow-sm">
            <div className="p-2">
              <AspectRatio ratio={1/1}>
                <Skeleton className="w-full h-full" />
              </AspectRatio>
            </div>
            <div className="p-3">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-2" />
              <Skeleton className="h-3 w-2/3 mb-2" />
              <Skeleton className="h-3 w-3/4 mb-2" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-7 w-1/3" />
                <Skeleton className="h-7 w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError || searchError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <div className="flex items-center justify-center mb-2 text-red-600">
          <AlertCircle className="h-6 w-6 mr-2" />
          <h3 className="text-lg font-semibold">Ошибка при загрузке товаров</h3>
        </div>
        <p className="text-red-600 mb-4">
          {searchError || (error instanceof Error ? error.message : 'Неизвестная ошибка')}
        </p>
        <Button 
          onClick={() => refetch()}
          className="px-4 py-2"
          variant="default"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Попробовать снова
        </Button>
      </div>
    );
  }

  if (products?.length === 0) {
    return (
      <div className="col-span-full py-8 text-center text-gray-500">
        Товары не найдены
      </div>
    );
  }

  // Use virtualization for large lists
  if (products.length > 20) {
    return (
      <div ref={containerRef} className="w-full" style={{ minHeight: `${CARD_HEIGHT}px` }}>
        {containerWidth > 0 && (
          <Grid
            columnCount={gridDimensions.columnCount}
            columnWidth={CARD_WIDTH + GAP}
            height={Math.min(window.innerHeight, gridDimensions.rowCount * (CARD_HEIGHT + GAP))}
            rowCount={gridDimensions.rowCount}
            rowHeight={CARD_HEIGHT + GAP}
            width={containerWidth}
          >
            {Cell}
          </Grid>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {products?.map((product) => (
        <AdminProductCard
          key={product.id}
          product={product}
          isSelected={selectedProducts.includes(product.id)}
          onSelect={() => handleProductSelect(product.id)}
          onDelete={onDelete}
          isDeleting={isDeleting && deleteProductId === product.id}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
};

export default ProductsGrid;
