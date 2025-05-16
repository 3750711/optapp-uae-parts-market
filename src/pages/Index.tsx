
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ShoppingCart, ChevronRight, ArrowRight } from 'lucide-react';
import Layout from "@/components/layout/Layout";
import SearchBar from "@/components/catalog/SearchBar";
import FiltersPanel from "@/components/catalog/FiltersPanel";
import ProductsSection from "@/components/catalog/ProductsSection";
import { useCarBrandsAndModels } from "@/hooks/useCarBrandsAndModels";
import useCatalogProducts from "@/hooks/useCatalogProducts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const [showFilters, setShowFilters] = useState(false);
  const productsPerPage = 8;
  const isMobile = useIsMobile();

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
      <div className="bg-white">
        {/* Hero section with improved responsive design */}
        <section className="bg-white relative overflow-hidden">
          <div className="container mx-auto px-4 py-12 md:py-24 lg:py-32 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 text-center md:text-left mb-8 md:mb-0">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-6 md:mb-8 leading-tight animate-fade-in">
                <span className="text-foreground">Оптовый рынок </span> 
                <span className="text-primary relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-1 after:bg-primary/30 after:rounded-full">автозапчастей</span> 
                <span className="block mt-2 md:mt-3">
                  <span className="text-secondary">partsbay.ae</span>
                </span>
              </h1>
              <p className="text-base md:text-xl text-foreground/80 mb-8 md:mb-10 max-w-lg mx-auto md:mx-0 animate-fade-in [animation-delay:300ms]">
                PartsBay - это B2B-маркетплейс, объединяющий продавцов и оптовых покупателей автозапчастей с рынков ОАЭ.
                Проверенные поставщики, прозрачные цены, рейтинги и отзывы.
              </p>
              <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 animate-fade-in [animation-delay:600ms]">
                <Button size="lg" className="group shadow-elevation-hover transition-all duration-300 hover:translate-y-[-4px]" asChild>
                  <Link to="/catalog">
                    Перейти в каталог
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 relative animate-fade-in [animation-delay:900ms]">
              <div className="relative mx-auto max-w-md">
                <div className="absolute top-[-10px] right-[-10px] w-20 h-20 bg-secondary/20 rounded-full blur-xl"></div>
                <div className="absolute bottom-[-15px] left-[-15px] w-24 h-24 bg-primary/20 rounded-full blur-xl"></div>
                <Card className="bg-white shadow-elevation overflow-hidden border-0">
                  <CardContent className="p-4">
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-16 h-16 text-primary opacity-80" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          {/* Decorative wave */}
          <div className="absolute bottom-0 left-0 w-full h-12 md:h-16">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-full">
              <path fill="#f9fafb" fillOpacity="1" d="M0,128L48,144C96,160,192,192,288,192C384,192,480,160,576,154.7C672,149,768,171,864,186.7C960,203,1056,213,1152,192C1248,171,1344,117,1392,90.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
        </section>

        {/* Features section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Наши преимущества</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-elevation-hover transition-all duration-300 hover:translate-y-[-4px] group">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Проверенные поставщики</h3>
                <p className="text-gray-600">Мы тщательно отбираем наших продавцов, чтобы гарантировать высокое качество товаров и услуг.</p>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-elevation-hover transition-all duration-300 hover:translate-y-[-4px] group">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Прозрачные цены</h3>
                <p className="text-gray-600">Никаких скрытых комиссий или наценок. Вы видите реальные оптовые цены от продавцов.</p>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-elevation-hover transition-all duration-300 hover:translate-y-[-4px] group">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Доставка по СНГ</h3>
                <p className="text-gray-600">Партнёрская доставка в Россию, Казахстан и другие страны СНГ.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Catalog section with improved styling */}
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 flex items-center justify-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              <span>Каталог товаров</span>
            </h2>
            
            <div className="mb-6 flex flex-col gap-4">
              {/* Search Bar Component */}
              <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearchSubmit={handleSearchSubmit} />
              
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
        </section>
      </div>
    </Layout>
  );
};

export default Index;
