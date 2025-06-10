
import React, { useState, useCallback, useMemo, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import ProductGrid from "@/components/product/ProductGrid";
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

const Catalog: React.FC = () => {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadMoreVisible = useIntersection(loadMoreRef, "400px");

  // Условная загрузка автомобильных данных только для каталога
  const {
    brands,
    brandModels,
    selectedBrand,
    selectBrand,
    findBrandNameById,
    findModelNameById,
    shouldLoadCarData
  } = useConditionalCarData();

  // Selected model state
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  // Search history
  const { addToHistory } = useSearchHistory();

  // Use the updated hook with external brand/model values and helper functions
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
  } = useCatalogProducts({
    productsPerPage: 8,
    externalSelectedBrand: selectedBrand,
    externalSelectedModel: selectedModel,
    findBrandNameById,
    findModelNameById,
    debounceTime: 500 // Устанавливаем время дебаунсинга для поисковых запросов
  });

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

  // Обработчик выбора элемента из истории поиска
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
    
    // Автоматически запускаем поиск
    setTimeout(() => {
      handleSearch();
    }, 100);
  }, [brands, brandModels, handleSearch, selectBrand]);

  // Enhanced search handlers
  const handleEnhancedSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const selectedBrandName = findBrandNameById(selectedBrand);
      const selectedModelName = findModelNameById(selectedModel);
      addToHistory(searchTerm, selectedBrandName || undefined, selectedModelName || undefined);
    }
    handleSearchSubmit(e);
  }, [searchTerm, selectedBrand, selectedModel, findBrandNameById, findModelNameById, addToHistory, handleSearchSubmit]);

  // Clear handlers
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

  // Get brand and model names for display
  const selectedBrandName = findBrandNameById(selectedBrand);
  const selectedModelName = findModelNameById(selectedModel);

  // Check if we have any active filters
  const hasAnyFilters = !!(
    activeSearchTerm || 
    selectedBrandName || 
    selectedModelName || 
    hideSoldProducts
  );

  const allProductsLoaded = mappedProducts.length > 0 && !hasNextPage && !isFetchingNextPage;

  return (
    <Layout>
      <Helmet>
        <title>Каталог товаров</title>
        <meta name="description" content="Browse our wide selection of products." />
      </Helmet>

      <div className="container mx-auto py-8 space-y-6">
        {/* Breadcrumb */}
        <CatalogBreadcrumb
          searchQuery={activeSearchTerm}
          selectedBrandName={selectedBrandName}
          selectedModelName={selectedModelName}
        />

        {/* Объединённый блок поиска и фильтров - только если автомобильные данные загружены */}
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

        {/* Базовый поиск если автомобильные данные не загружаются */}
        {!shouldLoadCarData && (
          <div className="flex flex-col md:flex-row gap-4">
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
              </form>
            </div>
          </div>
        )}

        {/* Active Filters */}
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

        {/* Sticky Filters for Mobile */}
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
                  <ProductGrid 
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
                  <Button onClick={handleClearAll}>
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
    </Layout>
  );
};

export default Catalog;
