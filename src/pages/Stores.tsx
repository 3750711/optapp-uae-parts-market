
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MapPin, Star, Package, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { StoreWithImages } from '@/types/store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOptimizedStores } from '@/hooks/useOptimizedStores';
import { useIsMobile } from '@/hooks/use-mobile';
import OptimizedImage from '@/components/ui/OptimizedImage';
import StoreSkeleton from '@/components/stores/StoreSkeleton';
import StoresFiltersComponent from '@/components/stores/StoresFilters';
import StoresMobileSearch from '@/components/stores/StoresMobileSearch';
import StoreCardMobile from '@/components/stores/StoreCardMobile';
import StoresPagination from '@/components/stores/StoresPagination';
import StoresSEO from '@/components/stores/StoresSEO';
import StoresBreadcrumb from '@/components/stores/StoresBreadcrumb';
import { useDebounce } from '@/hooks/useDebounce';

interface StoreWithProductCount extends StoreWithImages {
  product_count?: number;
}

const Stores: React.FC = () => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'rating' | 'product_count' | 'name'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Debounce search query for optimizing requests
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const pageSize = isMobile ? 8 : 12;

  console.log('🏪 Stores component render with params:', {
    currentPage,
    pageSize,
    searchQuery: debouncedSearchQuery,
    sortBy,
    sortOrder,
    isMobile
  });

  const { 
    data: stores, 
    totalCount, 
    hasNextPage, 
    hasPreviousPage, 
    isLoading,
    error
  } = useOptimizedStores({
    page: currentPage,
    pageSize,
    searchQuery: debouncedSearchQuery,
    sortBy,
    sortOrder,
    filters: {} // Убираем все фильтры
  });

  console.log('🏪 Stores data received:', {
    storesLength: stores?.length || 0,
    totalCount,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    hasError: !!error
  });

  if (error) {
    console.error('❌ Stores component error:', error);
  }

  const getMainImageUrl = (store: StoreWithProductCount) => {
    const primaryImage = store.store_images?.find(img => img.is_primary);
    return primaryImage?.url || store.store_images?.[0]?.url || '/placeholder.svg';
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort as typeof sortBy);
    setCurrentPage(1);
  };

  const handleSortOrderChange = (order: 'asc' | 'desc') => {
    setSortOrder(order);
    setCurrentPage(1);
  };

  return (
    <Layout>
      {/* SEO Component */}
      <StoresSEO 
        totalCount={totalCount} 
        searchQuery={debouncedSearchQuery || undefined}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <StoresBreadcrumb 
          searchQuery={debouncedSearchQuery || undefined} 
          totalCount={totalCount}
        />

        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Магазины автозапчастей
          </h1>
          <p className="text-gray-600">
            Найдите проверенных продавцов автозапчастей в ОАЭ
          </p>
        </div>

        {/* Search and Sorting */}
        {isMobile ? (
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <StoresMobileSearch
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              sortBy={sortBy}
              onSortChange={handleSortChange}
              sortOrder={sortOrder}
              onSortOrderChange={handleSortOrderChange}
            />
          </div>
        ) : (
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <StoresFiltersComponent
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              sortBy={sortBy}
              onSortChange={handleSortChange}
              sortOrder={sortOrder}
              onSortOrderChange={handleSortOrderChange}
            />
          </div>
        )}

        {/* Results count */}
        {!isLoading && (
          <div className="mb-4 text-sm text-gray-600 animate-fade-in" style={{ animationDelay: '200ms' }}>
            {searchQuery ? (
              `Найдено ${totalCount} магазинов по запросу "${searchQuery}"`
            ) : (
              `Всего магазинов: ${totalCount}`
            )}
          </div>
        )}

        {/* Stores Grid */}
        {isLoading ? (
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
            {Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <StoreSkeleton />
              </div>
            ))}
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-16 animate-scale-in">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4 animate-float">🏪</div>
              <h3 className="text-xl font-medium mb-2">
                {searchQuery ? 'Магазины не найдены' : 'Пока нет магазинов'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery
                  ? 'По заданным критериям ничего не найдено. Попробуйте изменить параметры поиска.'
                  : 'Магазины появятся здесь, когда продавцы их создадут.'
                }
              </p>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery('')}
                  className="transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  Очистить поиск
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile optimized grid */}
            {isMobile ? (
              <div className="space-y-4">
                {stores.map((store, index) => (
                  <div 
                    key={store.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <StoreCardMobile store={store} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {stores.map((store, index) => (
                  <Card 
                    key={store.id} 
                    className="group overflow-hidden h-full flex flex-col transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 animate-fade-in border-0 shadow-card hover:shadow-elevation"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <OptimizedImage
                        src={getMainImageUrl(store)}
                        alt={store.name}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="absolute top-3 right-3 transform transition-all duration-300 group-hover:scale-110">
                        {store.verified ? (
                          <Badge variant="default" className="flex items-center gap-1 bg-green-500 hover:bg-green-600 shadow-lg">
                            <ShieldCheck className="w-3 h-3" />
                            Проверено
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1 bg-white/90 backdrop-blur-sm">
                            Не проверено
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <CardHeader className="pb-3 transition-all duration-300 group-hover:pb-4">
                      <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                          <Link 
                            to={`/stores/${store.id}`} 
                            className="hover:text-primary transition-all duration-300 truncate text-lg group-hover:text-primary"
                            title={store.name}
                          >
                            {store.name}
                          </Link>
                          {store.verified && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Проверенный магазин</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <div className="flex items-center flex-shrink-0 ml-2 transition-transform duration-300 group-hover:scale-110">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="text-sm font-medium">
                            {store.rating?.toFixed(1) || '-'}
                          </span>
                        </div>
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-sm transition-colors duration-300 group-hover:text-gray-700">
                        {store.description || 'Описание отсутствует'}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 flex-grow pt-0">
                      <div className="flex items-center text-sm text-gray-600 transition-all duration-300 group-hover:text-gray-700 group-hover:translate-x-1">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0 transition-colors duration-300 group-hover:text-primary" />
                        <span className="truncate" title={store.address}>
                          {store.address}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 transition-all duration-300 group-hover:text-gray-700 group-hover:translate-x-1">
                        <Package className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0 transition-colors duration-300 group-hover:text-primary" />
                        <span>{store.product_count || 0} объявлений</span>
                      </div>
                      
                      {store.tags && store.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {store.tags.slice(0, 3).map((tag, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="text-xs capitalize transition-all duration-300 hover:bg-primary hover:text-white"
                            >
                              {tag.replace('_', ' ')}
                            </Badge>
                          ))}
                          {store.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs transition-all duration-300 hover:bg-secondary hover:text-white">
                              +{store.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter className="pt-3">
                      <Button 
                        asChild 
                        variant="outline" 
                        className="w-full transition-all duration-300 hover:bg-primary hover:text-white hover:scale-105 hover:shadow-button border-primary/20 group-hover:border-primary/50"
                      >
                        <Link to={`/stores/${store.id}`}>Подробнее</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
              <StoresPagination
                currentPage={currentPage}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                hasNextPage={hasNextPage}
                hasPreviousPage={hasPreviousPage}
              />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Stores;
