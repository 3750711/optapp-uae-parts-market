import React, { useState, useCallback, useMemo, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import ProductGrid from "@/components/product/ProductGrid";
import CatalogSkeleton from "@/components/catalog/CatalogSkeleton";
import CatalogFilters from "@/components/catalog/CatalogFilters";
import { FilterState } from "@/components/catalog/CatalogFilters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIntersection } from "@/hooks/useIntersection";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { ProductProps } from "@/components/product/ProductCard";

const Catalog: React.FC = () => {
  const [filterState, setFilterState] = useState<FilterState>({
    brands: [],
    models: [],
    priceRange: { min: 0, max: 10000 },
    condition: [],
  });
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadMoreVisible = useIntersection(loadMoreRef, "400px");

  const {
    searchQuery,
    setSearchQuery,
    hasSearched,
    selectedBrand,
    setSelectedBrand,
    selectedModel,
    setSelectedModel,
    selectedBrandName,
    setSelectedBrandName,
    selectedModelName,
    setSelectedModelName,
    hideSoldProducts,
    setHideSoldProducts,
    mappedProducts,
    productChunks,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    handleClearSearch,
    handleSearchSubmit,
    isActiveFilters
  } = useCatalogProducts();

  // Load more when the loadMoreRef is visible
  React.useEffect(() => {
    if (isLoadMoreVisible && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isLoadMoreVisible, fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleRetry = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const allProductsLoaded = mappedProducts.length > 0 && !hasNextPage && !isFetchingNextPage;

  return (
    <>
      <Helmet>
        <title>Каталог товаров</title>
        <meta name="description" content="Browse our wide selection of products." />
      </Helmet>

      <div className="container mx-auto py-8 space-y-6">
        {/* Search and Filters */}
        <Card className="mb-4">
          <div className="p-4">
            <CatalogFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedBrand={selectedBrand}
              setSelectedBrand={setSelectedBrand}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              selectedBrandName={selectedBrandName}
              setSelectedBrandName={setSelectedBrandName}
              selectedModelName={selectedModelName}
              setSelectedModelName={setSelectedModelName}
              hideSoldProducts={hideSoldProducts}
              setHideSoldProducts={setHideSoldProducts}
              handleClearSearch={handleClearSearch}
              handleSearchSubmit={handleSearchSubmit}
              isActiveFilters={isActiveFilters}
            />
          </div>
        </Card>

        {/* Product Grid or Skeleton */}
        {isLoading ? (
          <CatalogSkeleton />
        ) : isError ? (
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
        ) : (
          <>
            {mappedProducts.length > 0 ? (
              <>
                {productChunks.map((chunk, index) => (
                  <ProductGrid key={index} products={chunk} />
                ))}

                {(hasNextPage || isFetchingNextPage) && (
                  <div className="mt-8 flex flex-col items-center justify-center">
                    <div
                      ref={loadMoreRef}
                      className="h-20 w-full flex items-center justify-center"
                    >
                      {isFetchingNextPage ? (
                        <div className="flex items-center justify-center">
                          <div className="w-8 h-8 border-4 border-t-link rounded-full animate-spin"></div>
                          <span className="ml-3 text-muted-foreground">Загрузка товаров...</span>
                        </div>
                      ) : (
                        <Button onClick={fetchNextPage} className="bg-primary hover:bg-primary/90">
                          Загрузить ещё
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="max-w-md mx-auto">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Ничего не найдено
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Попробуйте изменить параметры поиска или фильтры
                  </p>
                  <Button onClick={handleClearSearch}>
                    Сбросить фильтры
                  </Button>
                </div>
              </div>
            )}

            {allProductsLoaded && (
              <div className="text-center py-6 text-gray-500">
                Вы просмотрели все товары
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Catalog;
