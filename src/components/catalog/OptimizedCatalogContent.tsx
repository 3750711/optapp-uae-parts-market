
import React, { memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, RefreshCw } from 'lucide-react';
import { useBatchOffers, BatchOfferData } from '@/hooks/use-price-offers-batch';

interface OptimizedCatalogContentProps {
  isLoading: boolean;
  isError: boolean;
  mappedProducts: any[];
  productChunks: any[][];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  allProductsLoaded: boolean;
  hasAnyFilters: boolean;
  loadMoreRef: React.RefObject<HTMLDivElement>;
  handleLoadMore: () => void;
  handleRetry: () => Promise<void>;
  handleClearAll: () => void;
}

// Мемоизированный компонент товара
const MemoizedProductCard = memo(({ product }: { product: any }) => {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-100 rounded-md mb-3 flex items-center justify-center">
        {product.preview_image_url ? (
          <img 
            src={product.preview_image_url} 
            alt={product.title}
            className="w-full h-full object-cover rounded-md"
            loading="lazy"
          />
        ) : (
          <Package className="h-12 w-12 text-gray-400" />
        )}
      </div>
      <h3 className="font-semibold text-sm mb-2 line-clamp-2">{product.title}</h3>
      <div className="text-lg font-bold text-primary mb-2">
        ${product.price}
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        <div>{product.brand} {product.model}</div>
        <div>{product.seller_name}</div>
      </div>
    </div>
  );
});

// Мемоизированная сетка товаров
const MemoizedProductGrid = memo(({ products, batchOffersData }: { products: any[], batchOffersData?: BatchOfferData[] }) => {
  const productElements = useMemo(() => {
    return products.map((product) => (
      <MemoizedProductCard key={product.id} product={product} />
    ));
  }, [products]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {productElements}
    </div>
  );
});

// Мемоизированный компонент загрузки
const MemoizedLoadingState = memo(() => (
  <div className="flex justify-center items-center py-12">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="text-gray-600">Загрузка товаров...</p>
    </div>
  </div>
));

// Мемоизированное состояние ошибки
const MemoizedErrorState = memo(({ onRetry }: { onRetry: () => Promise<void> }) => (
  <div className="flex flex-col items-center justify-center py-12 space-y-4">
    <AlertTriangle className="h-12 w-12 text-red-500" />
    <div className="text-center space-y-2">
      <h3 className="text-lg font-semibold text-gray-900">Ошибка загрузки</h3>
      <p className="text-gray-600">Не удалось загрузить товары</p>
    </div>
    <Button onClick={onRetry} variant="outline">
      <RefreshCw className="h-4 w-4 mr-2" />
      Попробовать снова
    </Button>
  </div>
));

// Мемоизированное пустое состояние
const MemoizedEmptyState = memo(({ hasFilters, onClearAll }: { 
  hasFilters: boolean; 
  onClearAll: () => void; 
}) => (
  <div className="flex flex-col items-center justify-center py-12 space-y-4">
    <Package className="h-12 w-12 text-gray-400" />
    <div className="text-center space-y-2">
      <h3 className="text-lg font-semibold text-gray-900">
        {hasFilters ? 'Товары не найдены' : 'Нет товаров'}
      </h3>
      <p className="text-gray-600">
        {hasFilters 
          ? 'Попробуйте изменить параметры поиска'
          : 'В каталоге пока нет товаров'
        }
      </p>
    </div>
    {hasFilters && (
      <Button onClick={onClearAll} variant="outline">
        Сбросить фильтры
      </Button>
    )}
  </div>
));

const OptimizedCatalogContent: React.FC<OptimizedCatalogContentProps> = ({
  isLoading,
  isError,
  mappedProducts,
  hasNextPage,
  isFetchingNextPage,
  allProductsLoaded,
  hasAnyFilters,
  loadMoreRef,
  handleLoadMore,
  handleRetry,
  handleClearAll,
}) => {
  // Get batch offers for all products
  const productIds = useMemo(() => mappedProducts.map(p => p.id), [mappedProducts]);
  const { data: batchOffersData } = useBatchOffers(productIds, productIds.length > 0);
  
  // Мемоизируем состояние загрузки
  const loadingState = useMemo(() => {
    if (isLoading && mappedProducts.length === 0) {
      return <MemoizedLoadingState />;
    }
    return null;
  }, [isLoading, mappedProducts.length]);

  // Мемоизируем состояние ошибки
  const errorState = useMemo(() => {
    if (isError && mappedProducts.length === 0) {
      return <MemoizedErrorState onRetry={handleRetry} />;
    }
    return null;
  }, [isError, mappedProducts.length, handleRetry]);

  // Мемоизируем пустое состояние
  const emptyState = useMemo(() => {
    if (!isLoading && !isError && mappedProducts.length === 0) {
      return (
        <MemoizedEmptyState 
          hasFilters={hasAnyFilters} 
          onClearAll={handleClearAll} 
        />
      );
    }
    return null;
  }, [isLoading, isError, mappedProducts.length, hasAnyFilters, handleClearAll]);

  // Мемоизируем кнопку "Загрузить еще"
  const loadMoreButton = useMemo(() => {
    if (mappedProducts.length > 0 && hasNextPage) {
      return (
        <div className="flex justify-center py-8">
          <Button 
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
            variant="outline"
            size="lg"
          >
            {isFetchingNextPage ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Загрузка...
              </>
            ) : (
              'Загрузить еще'
            )}
          </Button>
        </div>
      );
    }
    return null;
  }, [mappedProducts.length, hasNextPage, handleLoadMore, isFetchingNextPage]);

  return (
    <div className="space-y-6">
      {loadingState}
      {errorState}
      {emptyState}
      
      {mappedProducts.length > 0 && (
        <>
          <MemoizedProductGrid products={mappedProducts} batchOffersData={batchOffersData} />
          
          {/* Индикатор бесконечной прокрутки */}
          <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
            {isFetchingNextPage && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            )}
          </div>
          
          {loadMoreButton}
          
          {allProductsLoaded && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Все товары загружены ({mappedProducts.length} шт.)
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default memo(OptimizedCatalogContent);
