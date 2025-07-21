
import React from 'react';
import UnifiedProductGrid from "@/components/product/UnifiedProductGrid";
import CatalogSkeleton from "@/components/catalog/CatalogSkeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProductProps } from '@/components/product/ProductCard';

interface CatalogContentProps {
  isLoading: boolean;
  isError: boolean;
  mappedProducts: ProductProps[];
  productChunks: ProductProps[][];
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  allProductsLoaded: boolean;
  hasAnyFilters: boolean;
  loadMoreRef: React.RefObject<HTMLDivElement>;
  handleLoadMore: () => void;
  handleRetry: () => void;
  handleClearAll: () => void;
}

const CatalogContent: React.FC<CatalogContentProps> = ({
  isLoading,
  isError,
  mappedProducts,
  productChunks,
  hasNextPage,
  isFetchingNextPage,
  allProductsLoaded,
  hasAnyFilters,
  loadMoreRef,
  handleLoadMore,
  handleRetry,
  handleClearAll,
}) => {
  if (isLoading) {
    return (
      <div>
        <CatalogSkeleton />
        <div className="text-center mt-4 text-gray-500">
          Загрузка товаров...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <div className="font-medium mb-1">Ошибка загрузки товаров</div>
            <div className="text-sm">
              Не удалось загрузить товары. Пожалуйста, попробуйте еще раз.
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Повторить
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (mappedProducts.length > 0) {
    return (
      <>
        <div className="mb-4 text-sm text-gray-600">
          Найдено товаров: {mappedProducts.length}
        </div>
        
        {productChunks.map((chunk, index) => (
          <UnifiedProductGrid 
            key={index} 
            products={chunk} 
            viewMode="list"
            useSimpleOfferButton={true}
          />
        ))}

        {/* Optimized intersection trigger for smooth auto-loading */}
        {productChunks.length > 0 && hasNextPage && (
          <div
            ref={loadMoreRef}
            className="h-1 w-full opacity-0 pointer-events-none -mb-32"
            aria-hidden="true"
          />
        )}

        {(hasNextPage || isFetchingNextPage) && (
          <div className="mt-8 mb-4 flex flex-col items-center justify-center">
            <div className="h-16 w-full flex items-center justify-center">
              {isFetchingNextPage ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-muted-foreground">Загрузка товаров...</span>
                </div>
              ) : (
                <Button 
                  onClick={handleLoadMore} 
                  variant="outline"
                  size="lg"
                  className="min-w-[140px]"
                >
                  Загрузить ещё
                </Button>
              )}
            </div>
          </div>
        )}

        {allProductsLoaded && mappedProducts.length > 0 && (
          <div className="text-center py-6 text-gray-500">
            Вы просмотрели все товары
          </div>
        )}
      </>
    );
  }

  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <div className="max-w-md mx-auto">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">
          Товары не найдены
        </h3>
        <p className="text-gray-500 mb-6">
          {hasAnyFilters 
            ? "Попробуйте изменить параметры поиска или фильтры" 
            : "В настоящее время товары отсутствуют"
          }
        </p>
        {hasAnyFilters && (
          <Button onClick={handleClearAll}>
            Сбросить фильтры
          </Button>
        )}
        <div className="mt-4">
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CatalogContent;
