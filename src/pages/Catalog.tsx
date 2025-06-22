import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { SafeHelmet } from "@/components/seo/SafeHelmet";
import { useOptimizedCatalogProducts } from "@/hooks/useOptimizedCatalogProducts";
import { Button } from "@/components/ui/button";
import { useIntersection } from "@/hooks/useIntersection";
import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import ActiveFilters from "@/components/catalog/ActiveFilters";
import StickyFilters from "@/components/catalog/StickyFilters";
import CatalogSearchAndFilters from "@/components/catalog/CatalogSearchAndFilters";
import { useConditionalCarData } from "@/hooks/useConditionalCarData";
import { useSearchHistory, SearchHistoryItem } from "@/hooks/useSearchHistory";
import Layout from "@/components/layout/Layout";
import CatalogContent from "@/components/catalog/CatalogContent";

const Catalog: React.FC = () => {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadMoreVisible = useIntersection(loadMoreRef, "400px");

  const {
    brands,
    brandModels,
    selectedBrand,
    selectBrand,
    findBrandNameById,
    findModelNameById,
    shouldLoadCarData
  } = useConditionalCarData();

  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const { addToHistory } = useSearchHistory();

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
  } = useOptimizedCatalogProducts({
    productsPerPage: 8,
    externalSelectedBrand: selectedBrand,
    externalSelectedModel: selectedModel,
    findBrandNameById,
    findModelNameById,
    debounceTime: 1000
  });

  React.useEffect(() => {
    if (isLoadMoreVisible && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isLoadMoreVisible, fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Debug logging for catalog state
  useEffect(() => {
    console.log('📊 Catalog state:', {
      isLoading,
      isError,
      productsCount: mappedProducts.length,
      hasNextPage,
      isFetchingNextPage,
      activeSearchTerm,
      selectedBrand,
      selectedModel,
      hideSoldProducts
    });
  }, [isLoading, isError, mappedProducts.length, hasNextPage, isFetchingNextPage, activeSearchTerm, selectedBrand, selectedModel, hideSoldProducts]);

  const handleRetry = async () => {
    console.log('🔄 Manual retry triggered');
    try {
      await refetch();
    } catch (error) {
      console.error('❌ Retry failed:', error);
    }
  };

  const handleSelectFromHistory = useCallback((item: SearchHistoryItem) => {
    setSearchTerm(item.query);
    
    if (item.brand && brands.length > 0) {
      const brandId = brands.find(b => b.name === item.brand)?.id;
      if (brandId) selectBrand(brandId);
    }
    
    if (item.model && brandModels.length > 0) {
      const modelId = brandModels.find(m => m.name === item.model)?.id;
      if (modelId) setSelectedModel(modelId);
    }
    
    setTimeout(() => {
      handleSearch();
    }, 100);
  }, [brands, brandModels, handleSearch, selectBrand]);

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
    selectBrand(null);
    setSelectedModel(null);
  }, [selectBrand]);

  const handleClearModel = useCallback(() => {
    setSelectedModel(null);
  }, []);

  const handleClearSoldFilter = useCallback(() => {
    setHideSoldProducts(false);
  }, [setHideSoldProducts]);

  const handleClearAll = useCallback(() => {
    handleClearSearch();
    selectBrand(null);
    setSelectedModel(null);
    setHideSoldProducts(false);
  }, [handleClearSearch, selectBrand, setHideSoldProducts]);

  const selectedBrandName = findBrandNameById(selectedBrand);
  const selectedModelName = findModelNameById(selectedModel);

  const hasAnyFilters = !!(
    activeSearchTerm || 
    selectedBrandName || 
    selectedModelName || 
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
          selectedBrandName={selectedBrandName}
          selectedModelName={selectedModelName}
        />

        {shouldLoadCarData && (
          <CatalogSearchAndFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeSearchTerm={activeSearchTerm}
            onSearch={handleSearch}
            onClearSearch={handleClearSearch}
            onSearchSubmit={handleEnhancedSearchSubmit}
            selectedBrand={selectedBrand}
            selectBrand={selectBrand}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            brands={brands}
            brandModels={brandModels}
            hideSoldProducts={hideSoldProducts}
            setHideSoldProducts={setHideSoldProducts}
            onSelectFromHistory={handleSelectFromHistory}
          />
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
            selectedBrandName={selectedBrandName}
            selectedModelName={selectedModelName}
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
          selectedBrandName={selectedBrandName}
          selectedModelName={selectedModelName}
          onClearSearch={handleClearSearch}
          onOpenFilters={() => {}}
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
