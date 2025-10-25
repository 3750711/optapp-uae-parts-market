import React, { useRef, useEffect, useCallback } from 'react';
import { useOptimizedCatalogProducts } from '@/hooks/useOptimizedCatalogProducts';
import { useIntersection } from '@/hooks/useIntersection';
import CatalogContent from '@/components/catalog/CatalogContent';
import SearchControls from '@/components/catalog/SearchControls';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export const HomeProductsSection: React.FC = () => {
  // Refs for intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const prefetchTriggerRef = useRef<HTMLDivElement>(null);
  const [fetchNextPageError, setFetchNextPageError] = React.useState(false);

  const {
    searchTerm,
    hideSoldProducts,
    setHideSoldProducts,
    mappedProducts,
    productChunks,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    handleSearch,
    handleClearSearch,
    refetch,
    totalProductsCount
  } = useOptimizedCatalogProducts({
    productsPerPage: 24,
  });

  const handleClearSoldFilter = () => {
    setHideSoldProducts(false);
  };

  const handleClearAll = () => {
    handleClearSearch();
    setHideSoldProducts(false);
  };

  // Intersection observers for auto-loading
  const isLoadMoreVisible = useIntersection(loadMoreRef, "100px");
  const isPrefetchTriggerVisible = useIntersection(prefetchTriggerRef, "300px");

  // Helper functions
  const handleLoadMore = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      try {
        setFetchNextPageError(false);
        await fetchNextPage();
      } catch (error) {
        console.error('Error loading more products:', error);
        setFetchNextPageError(true);
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRetry = async () => {
    try {
      setFetchNextPageError(false);
      await refetch();
    } catch (error) {
      console.error('Error retrying products fetch:', error);
    }
  };

  const prefetchNextPage = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      try {
        await fetchNextPage();
      } catch (error) {
        console.debug('Prefetch error (non-critical):', error);
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Computed values
  const hasAnyFilters = !!(searchTerm || hideSoldProducts);
  const allProductsLoaded = mappedProducts.length > 0 && !hasNextPage && !isFetchingNextPage;

  // Auto-load more products when visible
  useEffect(() => {
    if (isLoadMoreVisible && hasNextPage && !isFetchingNextPage) {
      handleLoadMore();
    }
  }, [isLoadMoreVisible, handleLoadMore, hasNextPage, isFetchingNextPage]);

  // Prefetch next page when user is getting close
  useEffect(() => {
    if (isPrefetchTriggerVisible && hasNextPage && !isFetchingNextPage) {
      prefetchNextPage();
    }
  }, [isPrefetchTriggerVisible, prefetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Произошла ошибка при загрузке товаров</p>
        <Button onClick={() => refetch()} variant="outline">
          Попробовать снова
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <SearchControls 
        searchTerm={searchTerm}
        onSearch={handleSearch}
        hideSoldProducts={hideSoldProducts}
        setHideSoldProducts={setHideSoldProducts}
        isSearching={isLoading}
        onClearSearch={handleClearSearch}
        onClearSoldFilter={handleClearSoldFilter}
        onClearAll={handleClearAll}
      />

      {/* Products Count */}
      {!isLoading && mappedProducts.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Найдено товаров: <span className="font-semibold text-foreground">{totalProductsCount}</span>
        </div>
      )}

      {/* CatalogContent - unified display logic */}
      <CatalogContent
        isLoading={isLoading}
        isError={isError}
        mappedProducts={mappedProducts}
        productChunks={productChunks}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        allProductsLoaded={allProductsLoaded}
        hasAnyFilters={hasAnyFilters}
        loadMoreRef={loadMoreRef}
        handleLoadMore={handleLoadMore}
        handleRetry={handleRetry}
        handleClearAll={handleClearAll}
        totalProductsCount={totalProductsCount}
        fetchNextPageError={fetchNextPageError}
      />
    </div>
  );
};
