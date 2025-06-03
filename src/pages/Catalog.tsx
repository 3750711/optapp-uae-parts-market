
import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useCarBrandsAndModels } from "@/hooks/useCarBrandsAndModels";
import SearchBar from "@/components/catalog/SearchBar";
import FiltersPanel from "@/components/catalog/FiltersPanel";
import ProductsSection from "@/components/catalog/ProductsSection";
import CatalogSEO from "@/components/catalog/CatalogSEO";
import CatalogBreadcrumb from "@/components/catalog/CatalogBreadcrumb";
import ProductSorting, { SortOption } from "@/components/catalog/ProductSorting";
import ActiveFilters from "@/components/catalog/ActiveFilters";
import StickyFilters from "@/components/catalog/StickyFilters";
import ViewToggle, { ViewMode } from "@/components/catalog/ViewToggle";
import useCatalogProducts from "@/hooks/useCatalogProducts";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import { SearchHistoryItem } from "@/hooks/useSearchHistory";

const Catalog: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('list'); // Default to list view for better performance
  const productsPerPage = viewMode === 'list' ? 16 : 8; // More products in list view
  
  // Car brands and models
  const {
    brands,
    brandModels,
    selectedBrand,
    selectBrand,
    isLoading: isLoadingBrands,
    findBrandNameById,
    findModelNameById
  } = useCarBrandsAndModels();

  // Products data and filter logic
  const {
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    hasSearched,
    selectedModel,
    setSelectedModel,
    selectedBrandName,
    setSelectedBrandName,
    selectedModelName,
    setSelectedModelName,
    hideSoldProducts,
    setHideSoldProducts,
    allProducts,
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
  } = useCatalogProducts(productsPerPage, sortBy);

  // Предзагрузка изображений следующих товаров
  const productImages = mappedProducts.map(product => product.preview_image || product.image).filter(Boolean);
  useImagePreloader(productImages, {
    enabled: !isLoading,
    preloadDistance: viewMode === 'list' ? 20 : 15,
    maxConcurrent: 6
  });

  // Update brand and model names when IDs change
  useEffect(() => {
    if (selectedBrand) {
      const brandName = findBrandNameById(selectedBrand);
      console.log('Selected brand ID:', selectedBrand, 'Brand name:', brandName);
      setSelectedBrandName(brandName);
    } else {
      setSelectedBrandName(null);
    }
  }, [selectedBrand, findBrandNameById, setSelectedBrandName]);

  useEffect(() => {
    if (selectedModel) {
      const modelName = findModelNameById(selectedModel);
      console.log('Selected model ID:', selectedModel, 'Model name:', modelName);
      setSelectedModelName(modelName);
    } else {
      setSelectedModelName(null);
    }
  }, [selectedModel, findModelNameById, setSelectedModelName]);

  // Handlers for clearing individual filters
  const handleClearBrand = () => {
    selectBrand(null);
    setSelectedModel(null);
  };

  const handleClearModel = () => {
    setSelectedModel(null);
  };

  const handleClearSoldFilter = () => {
    setHideSoldProducts(false);
  };

  const handleClearSearchQuery = () => {
    setSearchQuery('');
  };

  // Обработка выбора из истории поиска
  const handleSelectFromHistory = (item: SearchHistoryItem) => {
    // Если в истории есть бренд/модель, устанавливаем их
    if (item.brand) {
      const brand = brands.find(b => b.name === item.brand);
      if (brand) {
        selectBrand(brand.id);
      }
    }
    
    if (item.model) {
      const model = brandModels.find(m => m.name === item.model);
      if (model) {
        setSelectedModel(model.id);
      }
    }
    
    // Принудительно обновляем результаты
    setTimeout(() => {
      refetch();
    }, 100);
  };

  return (
    <>
      <CatalogSEO
        searchQuery={debouncedSearchQuery}
        selectedBrandName={selectedBrandName}
        selectedModelName={selectedModelName}
        totalProducts={allProducts.length}
      />
      
      {/* Sticky фильтры для мобильных */}
      <StickyFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedBrandName={selectedBrandName}
        selectedModelName={selectedModelName}
        onClearSearch={handleClearSearch}
        onOpenFilters={() => setShowFilters(true)}
        hasActiveFilters={isActiveFilters}
        handleSearchSubmit={handleSearchSubmit}
      />
      
      <Layout>
        <div className="bg-lightGray min-h-screen py-0">
          <div className="container mx-auto px-3 pb-20 pt-8 sm:pt-14">
            {/* Breadcrumb Navigation */}
            <CatalogBreadcrumb
              searchQuery={debouncedSearchQuery}
              selectedBrandName={selectedBrandName}
              selectedModelName={selectedModelName}
            />

            {/* Search and filters section */}
            <div className="mb-6 flex flex-col gap-4">
              {/* Search Bar Component */}
              <SearchBar 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleSearchSubmit={handleSearchSubmit}
                selectedBrandName={selectedBrandName}
                selectedModelName={selectedModelName}
                onSelectFromHistory={handleSelectFromHistory}
              />
              
              {/* Filters Panel Component */}
              <FiltersPanel
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                selectedBrand={selectedBrand}
                selectBrand={selectBrand}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                brands={brands}
                brandModels={brandModels}
                hideSoldProducts={hideSoldProducts}
                setHideSoldProducts={setHideSoldProducts}
                handleSearchSubmit={handleSearchSubmit}
                handleClearSearch={handleClearSearch}
                isActiveFilters={isActiveFilters}
              />

              {/* Active Filters Display */}
              <ActiveFilters
                searchQuery={debouncedSearchQuery}
                selectedBrandName={selectedBrandName}
                selectedModelName={selectedModelName}
                hideSoldProducts={hideSoldProducts}
                onClearSearch={handleClearSearchQuery}
                onClearBrand={handleClearBrand}
                onClearModel={handleClearModel}
                onClearSoldFilter={handleClearSoldFilter}
                onClearAll={handleClearSearch}
              />

              {/* Results summary, view toggle and sorting */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  {allProducts.length > 0 && (
                    <div className="text-sm text-gray-600">
                      Найдено товаров: <span className="font-semibold">{allProducts.length}</span>
                    </div>
                  )}
                  
                  <ViewToggle
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                  />
                </div>
                
                <ProductSorting
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />
              </div>
            </div>
            
            {/* Products Section Component */}
            <ProductsSection
              isLoading={isLoading}
              isError={isError}
              hasSearched={hasSearched}
              debouncedSearchQuery={debouncedSearchQuery}
              selectedBrand={selectedBrand}
              selectedModel={selectedModel}
              allProducts={allProducts}
              productChunks={productChunks}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              refetch={refetch}
              viewMode={viewMode}
            />
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Catalog;
