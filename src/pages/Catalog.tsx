
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
import useCatalogProducts from "@/hooks/useCatalogProducts";

const Catalog: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const productsPerPage = 8;
  
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

  return (
    <>
      <CatalogSEO
        searchQuery={debouncedSearchQuery}
        selectedBrandName={selectedBrandName}
        selectedModelName={selectedModelName}
        totalProducts={allProducts.length}
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

              {/* Results summary and sorting */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {allProducts.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Найдено товаров: <span className="font-semibold">{allProducts.length}</span>
                  </div>
                )}
                
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
            />
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Catalog;
