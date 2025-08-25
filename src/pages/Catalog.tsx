import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { SafeHelmet } from "@/components/seo/SafeHelmet";
import { useOptimizedCatalogProducts } from "@/hooks/useOptimizedCatalogProducts";
import { Button } from "@/components/ui/button";
import { useIntersection } from "@/hooks/useIntersection";
import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import StickyFilters from "@/components/catalog/StickyFilters";
import SearchControls from "@/components/catalog/SearchControls";
import CatalogContent from "@/components/catalog/CatalogContent";
import { useSearchHistory, SearchHistoryItem } from "@/hooks/useSearchHistory";
import Layout from "@/components/layout/Layout";
import BackButton from "@/components/navigation/BackButton";

const Catalog: React.FC = () => {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const prefetchTriggerRef = useRef<HTMLDivElement>(null);
  const isLoadMoreVisible = useIntersection(loadMoreRef, "100px");
  const isPrefetchTriggerVisible = useIntersection(prefetchTriggerRef, "300px");

  // Simplified - no car data needed

  const { addToHistory } = useSearchHistory();

  // Simplified catalog products with button-only search
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
    refetch,
    handleClearSearch,
    handleSearch,
    totalProductsCount
  } = useOptimizedCatalogProducts({
    productsPerPage: 24,
  });

  // Create prefetch function for compatibility
  const prefetchNextPage = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Auto-load more products when visible
  React.useEffect(() => {
    if (isLoadMoreVisible && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isLoadMoreVisible, fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Prefetch next page when user is getting close
  React.useEffect(() => {
    if (isPrefetchTriggerVisible && hasNextPage && !isFetchingNextPage) {
      prefetchNextPage();
    }
  }, [isPrefetchTriggerVisible, prefetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleRetry = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error retrying catalog fetch:', error);
    }
  };

  const handleSelectFromHistory = useCallback((item: SearchHistoryItem) => {
    handleSearch(item.query);
  }, [handleSearch]);

  const handleEnhancedSearch = useCallback((query: string) => {
    if (query.trim()) {
      addToHistory(query);
    }
    handleSearch(query);
  }, [addToHistory, handleSearch]);

  const handleClearSoldFilter = useCallback(() => {
    setHideSoldProducts(false);
  }, [setHideSoldProducts]);

  const handleClearAll = useCallback(() => {
    handleClearSearch();
    setHideSoldProducts(false);
  }, [handleClearSearch, setHideSoldProducts]);

  const hasAnyFilters = !!(
    searchTerm || 
    hideSoldProducts
  );

  const allProductsLoaded = mappedProducts.length > 0 && !hasNextPage && !isFetchingNextPage;

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <Layout>
      <SafeHelmet
        title="Каталог товаров"
        description="Browse our wide selection of products."
      />

      <div className="container mx-auto px-4 py-4">
        <BackButton className="mb-3" fallback="/" />
        
        <div className="mb-4">
          <CatalogBreadcrumb searchQuery={searchTerm} />
        </div>

        <div data-filters-section className="mb-6">
          <SearchControls 
            searchTerm={searchTerm}
            onSearch={handleEnhancedSearch}
            hideSoldProducts={hideSoldProducts}
            setHideSoldProducts={setHideSoldProducts}
            isSearching={isLoading}
            onClearSearch={handleClearSearch}
            onClearSoldFilter={handleClearSoldFilter}
            onClearAll={handleClearAll}
          />
        </div>

        <StickyFilters
          searchQuery={searchTerm}
          setSearchQuery={() => {}}
          onClearSearch={handleClearSearch}
          onOpenFilters={() => {
            const filtersSection = document.querySelector('[data-filters-section]');
            if (filtersSection) {
              filtersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          hasActiveFilters={hasAnyFilters}
          handleSearchSubmit={(e) => e.preventDefault()}
        />

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
        />
      </div>
    </Layout>
  );
};

export default Catalog;
