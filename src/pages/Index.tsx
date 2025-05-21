import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ShoppingCart, ChevronRight, ArrowRight, Store, Info, HelpCircle } from 'lucide-react';
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
                <Button variant="outline" size="lg" className="group shadow-sm hover:shadow-md transition-all duration-300" asChild>
                  <Link to="/buyer-guide" className="flex items-center">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Как покупать товар?
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

        {/* Features section - redesigned with Sellers, Buyers, About Us */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Наша платформа</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sellers Block */}
              <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-elevation-hover transition-all duration-300 hover:translate-y-[-4px] group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10"></div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors relative z-10">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Продавцам</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <span className="mr-2 text-primary font-bold">•</span>
                    <span>Доступ к тысячам оптовых покупателей</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary font-bold">•</span>
                    <span>Бесплатное размещение товаров</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary font-bold">•</span>
                    <span>Инструменты управления продажами</span>
                  </li>
                </ul>
                <div className="mt-5">
                  <Button variant="ghost" size="sm" className="text-primary group-hover:text-primary-hover" asChild>
                    <Link to="/seller-register">
                      Узнать больше
                      <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                </div>
              </div>
              
              {/* Buyers Block */}
              <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-elevation-hover transition-all duration-300 hover:translate-y-[-4px] group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-10 -mt-10"></div>
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors relative z-10">
                  <ShoppingCart className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Покупателям</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <span className="mr-2 text-secondary font-bold">•</span>
                    <span>Прямой контакт с поставщиками из ОАЭ</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-secondary font-bold">•</span>
                    <span>Оптовые цены без посредников</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-secondary font-bold">•</span>
                    <span>Широкий выбор автозапчастей</span>
                  </li>
                </ul>
                <div className="mt-5">
                  <Button variant="ghost" size="sm" className="text-secondary group-hover:text-secondary-hover" asChild>
                    <Link to="/catalog">
                      Перейти в каталог
                      <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                </div>
              </div>
              
              {/* About Us Block */}
              <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-elevation-hover transition-all duration-300 hover:translate-y-[-4px] group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10"></div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors relative z-10">
                  <Info className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">О нас</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <span className="mr-2 text-primary font-bold">•</span>
                    <span>Более 100 проверенных продавцов</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary font-bold">•</span>
                    <span>Прозрачная система рейтингов</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary font-bold">•</span>
                    <span>Техподдержка на русском языке</span>
                  </li>
                </ul>
                <div className="mt-5">
                  <Button variant="ghost" size="sm" className="text-primary group-hover:text-primary-hover" asChild>
                    <Link to="/about">
                      О компании
                      <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                </div>
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
