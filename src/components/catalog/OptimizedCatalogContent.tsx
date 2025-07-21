
import React, { memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, RefreshCw, Car, User, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBatchOffers, BatchOfferData } from '@/hooks/use-price-offers-batch';
import { SimpleOfferButton } from '@/components/price-offer/SimpleOfferButton';
import { Product } from '@/types/product';

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
const MemoizedProductCard = memo(({ product, offer }: { product: Product; offer?: any }) => {
  return (
    <div className="group bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        {product.product_images?.[0] ? (
          <img
            src={product.product_images[0].url}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        
        {/* Status badge - only show for sold items */}
        {product.status === 'sold' && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground px-2 py-1 rounded-md text-xs font-medium">
            Продан
          </div>
        )}
        
        {/* Lot number - prominently displayed */}
        {product.lot_number && (
          <div className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm text-primary-foreground px-2 py-1 rounded-md text-sm font-semibold">
            Лот #{product.lot_number}
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-2 flex-1">{product.title}</h3>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-primary">${product.price}</div>
            {product.delivery_price && product.delivery_price > 0 && (
              <div className="text-xs text-muted-foreground">
                + ${product.delivery_price} доставка
              </div>
            )}
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            <span>{product.brand} {product.model}</span>
          </div>
          
          {product.profiles && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{product.profiles.full_name || product.seller_name}</span>
              {product.profiles.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs">{Number(product.profiles.rating).toFixed(1)}</span>
                </div>
              )}
            </div>
          )}
          
          {(product.location || product.product_location) && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{product.location || product.product_location}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <SimpleOfferButton product={product} compact />
          
          {offer && (
            <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">
              Ваша ставка: ${offer.offered_price}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Мемоизированная сетка товаров
const MemoizedProductGrid = memo(({ products, batchOffersData }: { products: Product[], batchOffersData?: BatchOfferData[] }) => {
  const productElements = useMemo(() => {
    return products.map((product) => {
      const offer = batchOffersData?.find(o => o.product_id === product.id);
      return (
        <MemoizedProductCard key={product.id} product={product} offer={offer} />
      );
    });
  }, [products, batchOffersData]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
