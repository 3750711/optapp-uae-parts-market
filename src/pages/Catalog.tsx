import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { SafeHelmet } from "@/components/seo/SafeHelmet";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { Button } from "@/components/ui/button";
import { useIntersection } from "@/hooks/useIntersection";
import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import ActiveFilters from "@/components/catalog/ActiveFilters";
import StickyFilters from "@/components/catalog/StickyFilters";
import CatalogSearchAndFilters from "@/components/catalog/CatalogSearchAndFilters";
import CatalogContent from "@/components/catalog/CatalogContent";
import { useConditionalCarData } from "@/hooks/useConditionalCarData";
import { useSearchHistory, SearchHistoryItem } from "@/hooks/useSearchHistory";
import Layout from "@/components/layout/Layout";

const Catalog: React.FC = () => {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const prefetchTriggerRef = useRef<HTMLDivElement>(null);
  const isLoadMoreVisible = useIntersection(loadMoreRef, "100px");
  const isPrefetchTriggerVisible = useIntersection(prefetchTriggerRef, "300px");

  const {
    brands,
    brandModels,
    findBrandNameById,
    findModelNameById,
    shouldLoadCarData
  } = useConditionalCarData();

  const { addToHistory } = useSearchHistory();

  // Убираем batch offers из каталога для оптимизации производительности
  const {
    searchTerm,
    setSearchTerm,
    activeSearchTerm,
    hideSoldProducts,
    setHideSoldProducts,
    selectedBrand,
    setSelectedBrand,
    selectedModel,
    setSelectedModel,
    activeBrand,
    activeModel,
    activeBrandName,
    activeModelName,
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
    prefetchNextPage,
  } = useCatalogProducts({
    productsPerPage: 24,
    findBrandNameById,
    findModelNameById,
  });

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
    
    if (item.brand && brands.length > 0) {
      const brandId = brands.find(b => b.name === item.brand)?.id;
      if (brandId) setSelectedBrand(brandId);
    }
    
    if (item.model && brandModels.length > 0) {
      const modelId = brandModels.find(m => m.name === item.model)?.id;
      if (modelId) setSelectedModel(modelId);
    }
    
    setTimeout(() => {
      handleSearch();
    }, 100);
  }, [brands, brandModels, handleSearch, setSelectedBrand]);

  const handleEnhancedSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const selectedBrandName = findBrandNameById(selectedBrand);
      const selectedModelName = findModelNameById(selectedModel);
      addToHistory(searchTerm, selectedBrandName || undefined, selectedModelName || undefined);
    }
    handleSearchSubmit(e);
  }, [searchTerm, selectedBrand, selectedModel, findBrandNameById, findModelNameById, addToHistory, handleSearchSubmit]);

  const handleClearBrand = useCallback(() => {
    setSelectedBrand(null);
    setSelectedModel(null);
  }, [setSelectedBrand, setSelectedModel]);

  const handleClearModel = useCallback(() => {
    setSelectedModel(null);
  }, [setSelectedModel]);

  const handleClearSoldFilter = useCallback(() => {
    setHideSoldProducts(false);
  }, [setHideSoldProducts]);

  const handleClearAll = useCallback(() => {
    handleClearSearch();
  }, [handleClearSearch]);

  const selectedBrandName = findBrandNameById(selectedBrand);
  const selectedModelName = findModelNameById(selectedModel);

  const hasAnyFilters = !!(
    activeSearchTerm || 
    activeBrandName || 
    activeModelName || 
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
        <CatalogBreadcrumb
          searchQuery={activeSearchTerm}
          selectedBrandName={activeBrandName}
          selectedModelName={activeModelName}
        />

        {shouldLoadCarData && (
          <div data-filters-section>
            <CatalogSearchAndFilters 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              activeSearchTerm={activeSearchTerm}
              onSearch={handleSearch}
              onClearSearch={handleClearSearch}
              onSearchSubmit={handleEnhancedSearchSubmit}
              selectedBrand={selectedBrand}
              selectBrand={setSelectedBrand}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              brands={brands}
              brandModels={brandModels}
              hideSoldProducts={hideSoldProducts}
              setHideSoldProducts={setHideSoldProducts}
              onSelectFromHistory={handleSelectFromHistory}
            />
          </div>
        )}

        {!shouldLoadCarData && (
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <form onSubmit={handleEnhancedSearchSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Поиск товаров..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button type="submit">
                  Поиск
                </Button>
                {searchTerm && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleClearSearch}
                  >
                    Очистить
                  </Button>
                )}
              </form>
            </div>
          </div>
        )}

        {hasAnyFilters && (
          <ActiveFilters
            searchQuery={activeSearchTerm}
            selectedBrandName={activeBrandName}
            selectedModelName={activeModelName}
            hideSoldProducts={hideSoldProducts}
            onClearSearch={handleClearSearch}
            onClearBrand={handleClearBrand}
            onClearModel={handleClearModel}
            onClearSoldFilter={handleClearSoldFilter}
            onClearAll={handleClearAll}
          />
        )}

        <StickyFilters
          searchQuery={searchTerm}
          setSearchQuery={setSearchTerm}
          selectedBrandName={activeBrandName}
          selectedModelName={activeModelName}
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
        />
      </div>
    </Layout>
  );
};

export default Catalog;
