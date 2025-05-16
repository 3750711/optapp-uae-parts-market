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
  return <Layout>
      <div className="bg-white">
        {/* Hero section with improved design */}
        <section className="bg-white relative overflow-hidden">
          <div className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:py-32 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 text-center md:text-left mb-8 md:mb-0 animate-fade-in">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-6 md:mb-8 leading-tight">
                <span className="text-foreground">Оптовый рынок </span> 
                <span className="text-primary">автозапчастей</span> 
                <span className="block mt-2 md:mt-3">
                  <span className="text-secondary">partsbay.ae</span>
                </span>
              </h1>
              <p className="text-base md:text-xl text-foreground/80 mb-8 md:mb-10 max-w-lg">PartsBay - это B2B-маркетплейс, объединяющий продавцов и оптовых покупателей автозапчастей с рынков ОАЭ.
Проверенные поставщики, прозрачные цены, рейтинги и отзывы.
Удобный поиск по каталогу, прямой контакт с продавцами и партнёрская доставка в Россию, Казахстан и другие страны СНГ.

            </p>
              <div className="flex justify-center md:justify-start">
                <Button size="lg" className="group shadow-elevation-hover" asChild>
                  
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              {/* Hero image or illustration could be added here */}
            </div>
          </div>
          {/* Decorative wave or shape at the bottom */}
          <div className="absolute bottom-0 left-0 w-full h-12 md:h-16">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-full">
              <path fill="#f9fafb" fillOpacity="1" d="M0,128L48,144C96,160,192,192,288,192C384,192,480,160,576,154.7C672,149,768,171,864,186.7C960,203,1056,213,1152,192C1248,171,1344,117,1392,90.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
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