import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ShoppingCart, ChevronRight } from 'lucide-react';
import Layout from "@/components/layout/Layout";
import SearchBar from "@/components/catalog/SearchBar";
import FiltersPanel from "@/components/catalog/FiltersPanel";
import ProductsSection from "@/components/catalog/ProductsSection";
import { useCarBrandsAndModels } from "@/hooks/useCarBrandsAndModels";
import useCatalogProducts from "@/hooks/useCatalogProducts";
const Index = () => {
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
  return <Layout className="bg-gray-50 rounded-sm">
      <div className="bg-blue-500">
        {/* Hero section - keeping this from the original page */}
        <section className="bg-gradient-to-br from-primary/5 to-secondary/5 relative overflow-hidden">
          <div className="container mx-auto px-4 py-12 md:px-6 md:py-20 lg:py-24 flex flex-col md:flex-row items-center rounded-full bg-white/[0.31]">
            <div className="md:w-1/2 text-center md:text-left mb-8 md:mb-0 animate-fade-in">
              <h1 className="text-3xl md:text-4xl lg:text-6xl font-extrabold mb-4 md:mb-6 leading-tight">
                <span className="text-foreground">Оптовый рынок </span> 
                <span className="text-primary">автозапчастей</span> 
                <span className="block mt-1 md:mt-2">
                  <span className="text-secondary">partsbay.ae</span>
                </span>
              </h1>
              <p className="text-base md:text-lg text-foreground/80 mb-6 md:mb-8 max-w-lg">
                PartsBay - платформа, объединяющая продавцов и покупателей автозапчастей. Здесь каждый найдет качественные товары, надежных партнеров и комфортный сервис.
              </p>
              <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-3 md:gap-4">
                <Button size="lg" className="group w-full sm:w-auto" asChild>
                  <Link to="/catalog">
                    К каталогу
                    <ChevronRight className="ml-1 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                  <Link to="/register">Регистрация</Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 relative animate-float">
              <div className="w-full h-60 md:h-80 lg:h-96 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-2xl shadow-elevation relative overflow-hidden">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-2xl md:text-3xl font-bold text-primary">OPTAPP</h3>
                    <p className="text-foreground/70 mt-2">Ваш надежный партнер</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Catalog section */}
        <section className="py-8 md:py-12 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">Каталог товаров</h2>
            
            <div className="mb-6 flex flex-col gap-4">
              {/* Search Bar Component */}
              <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearchSubmit={handleSearchSubmit} />
              
              {/* Filters Panel Component */}
              <FiltersPanel showFilters={showFilters} setShowFilters={setShowFilters} selectedBrand={selectedBrand} selectBrand={selectBrand} selectedModel={selectedModel} setSelectedModel={setSelectedModel} brands={brands} brandModels={brandModels} hideSoldProducts={hideSoldProducts} setHideSoldProducts={setHideSoldProducts} handleSearchSubmit={handleSearchSubmit} handleClearSearch={handleClearSearch} isActiveFilters={isActiveFilters} />
            </div>
            
            {/* Products Section Component */}
            <ProductsSection isLoading={isLoading} isError={isError} hasSearched={hasSearched} debouncedSearchQuery={debouncedSearchQuery} selectedBrand={selectedBrand} selectedModel={selectedModel} allProducts={allProducts} productChunks={productChunks} hasNextPage={hasNextPage} isFetchingNextPage={isFetchingNextPage} fetchNextPage={fetchNextPage} refetch={refetch} />
          </div>
        </section>
      </div>
    </Layout>;
};
export default Index;