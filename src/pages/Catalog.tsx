
import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { useCarBrandsAndModels } from "@/hooks/useCarBrandsAndModels";
import SearchBar from "@/components/catalog/SearchBar";
import FiltersPanel from "@/components/catalog/FiltersPanel";
import ProductsSection from "@/components/catalog/ProductsSection";
import useCatalogProducts from "@/hooks/useCatalogProducts";

const Catalog: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const productsPerPage = 8;
  
  // Car brands and models
  const {
    brands,
    brandModels,
    selectedBrand,
    selectBrand,
    isLoading: isLoadingBrands
  } = useCarBrandsAndModels();

  // Products data and filter logic
  const {
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    hasSearched,
    selectedModel,
    setSelectedModel,
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
  } = useCatalogProducts(productsPerPage);

  return (
    <Layout>
      <div className="bg-lightGray min-h-screen py-0">
        <div className="container mx-auto px-3 pb-20 pt-8 sm:pt-14">
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
  );
};

export default Catalog;
