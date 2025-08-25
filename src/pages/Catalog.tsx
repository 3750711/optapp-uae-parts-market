import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { SafeHelmet } from "@/components/seo/SafeHelmet";
import { useOptimizedCatalogProducts } from "@/hooks/useOptimizedCatalogProducts";
import { Button } from "@/components/ui/button";
import { useIntersection } from "@/hooks/useIntersection";
import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import ActiveFilters from "@/components/catalog/ActiveFilters";
import StickyFilters from "@/components/catalog/StickyFilters";
import CatalogSearchAndFilters from "@/components/catalog/CatalogSearchAndFilters";
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

  // Optimized catalog products with simple search
  const {
    searchTerm,
    setSearchTerm,
    activeSearchTerm,
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
    handleSearchSubmit,
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
    setSearchTerm(item.query);
    setTimeout(() => {
      handleSearch();
    }, 100);
  }, [handleSearch, setSearchTerm]);

  const handleEnhancedSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      addToHistory(searchTerm);
    }
    handleSearchSubmit(e);
  }, [searchTerm, addToHistory, handleSearchSubmit]);

  const handleClearSoldFilter = useCallback(() => {
    setHideSoldProducts(false);
  }, [setHideSoldProducts]);

  const handleClearAll = useCallback(() => {
    handleClearSearch();
    setHideSoldProducts(false);
  }, [handleClearSearch, setHideSoldProducts]);

  const hasAnyFilters = !!(
    activeSearchTerm || 
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

      <div className="container mx-auto px-4 py-8">
        <BackButton className="mb-4" fallback="/" />
        <CatalogBreadcrumb
          searchQuery={activeSearchTerm}
        />

        <div data-filters-section>
          <CatalogSearchAndFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={handleSearch}
            hideSoldProducts={hideSoldProducts}
            setHideSoldProducts={setHideSoldProducts}
            isSearching={isLoading}
          />
        </div>

        {hasAnyFilters && (
          <ActiveFilters
            searchQuery={activeSearchTerm}
            hideSoldProducts={hideSoldProducts}
            onClearSearch={handleClearSearch}
            onClearSoldFilter={handleClearSoldFilter}
            onClearAll={handleClearAll}
          />
        )}

        <StickyFilters
          searchQuery={searchTerm}
          setSearchQuery={setSearchTerm}
          onClearSearch={handleClearSearch}
          onOpenFilters={() => {
            const filtersSection = document.querySelector('[data-filters-section]');
            if (filtersSection) {
              filtersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          hasActiveFilters={hasAnyFilters}
          handleSearchSubmit={handleEnhancedSearchSubmit}
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
