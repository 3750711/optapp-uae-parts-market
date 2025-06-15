
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useOptimizedCatalogProducts } from "@/hooks/useOptimizedCatalogProducts";
import UnifiedProductGrid from "@/components/product/UnifiedProductGrid";
import CatalogSkeleton from "@/components/catalog/CatalogSkeleton";
import { Button } from "@/components/ui/button";
import { useIntersection } from "@/hooks/useIntersection";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import ActiveFilters from "@/components/catalog/ActiveFilters";
import StickyFilters from "@/components/catalog/StickyFilters";
import CatalogSearchAndFilters from "@/components/catalog/CatalogSearchAndFilters";
import { useConditionalCarData } from "@/hooks/useConditionalCarData";
import { useSearchHistory, SearchHistoryItem } from "@/hooks/useSearchHistory";
import Layout from "@/components/layout/Layout";
import { Loader2 } from 'lucide-react';

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
    isActiveFilters
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
      <Helmet>
        <title>Каталог товаров</title>
        <meta name="description" content="Browse our wide selection of products." />
      </Helmet>

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

        {isLoading ? (
          <div>
            <CatalogSkeleton />
            <div className="text-center mt-4 text-gray-500">
              Загрузка товаров...
            </div>
          </div>
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
                <div className="mb-4 text-sm text-gray-600">
                  Найдено товаров: {mappedProducts.length}
                </div>
                
                {productChunks.map((chunk, index) => (
                  <UnifiedProductGrid 
                    key={index} 
                    products={chunk} 
                    viewMode="list"
                  />
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
                        <Button onClick={handleLoadMore} className="bg-primary hover:bg-primary/90">
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
            )}

            {allProductsLoaded && mappedProducts.length > 0 && (
              <div className="text-center py-6 text-gray-500">
                Вы просмотрели все товары
              </div>
            )}
          </>
        )}

        {hasNextPage && (
          <div className="mt-8 text-center">
            <Button 
              onClick={handleLoadMore}
              disabled={isFetchingNextPage}
              variant="outline"
              size="lg"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                'Загрузить еще'
              )}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Catalog;
