
import React, { useState, useMemo } from 'react';
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
import OptimizedImage from '@/components/ui/OptimizedImage';
import StoreSkeleton from '@/components/stores/StoreSkeleton';
import StoresFilters from '@/components/stores/StoresFilters';
import StoresPagination from '@/components/stores/StoresPagination';
import { useDebounce } from '@/hooks/useDebounce';

interface StoreWithProductCount extends StoreWithImages {
  product_count?: number;
}

const Stores: React.FC = () => {
  const { profile } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'rating' | 'product_count' | 'name'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Debounce search query для оптимизации запросов
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const pageSize = 12;

  const { 
    data: stores, 
    totalCount, 
    hasNextPage, 
    hasPreviousPage, 
    isLoading 
  } = useOptimizedStores({
    page: currentPage,
    pageSize,
    searchQuery: debouncedSearchQuery,
    sortBy,
    sortOrder
  });

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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Магазины</h1>
          <p className="text-gray-600">
            Найдите проверенных продавцов автозапчастей в ОАЭ
          </p>
        </div>

        {/* Filters and Search */}
        <StoresFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          sortOrder={sortOrder}
          onSortOrderChange={handleSortOrderChange}
        />

        {/* Results count */}
        {!isLoading && (
          <div className="mb-4 text-sm text-gray-600">
            {searchQuery ? (
              `Найдено ${totalCount} магазинов по запросу "${searchQuery}"`
            ) : (
              `Всего магазинов: ${totalCount}`
            )}
          </div>
        )}

        {/* Stores Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: pageSize }).map((_, i) => (
              <StoreSkeleton key={i} />
            ))}
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🏪</div>
              <h3 className="text-xl font-medium mb-2">
                {searchQuery ? 'Магазины не найдены' : 'Пока нет магазинов'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery 
                  ? `По запросу "${searchQuery}" ничего не найдено. Попробуйте изменить критерии поиска.`
                  : 'Магазины появятся здесь, когда продавцы их создадут.'
                }
              </p>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery('')}
                >
                  Очистить поиск
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {stores.map((store, index) => (
                <Card 
                  key={store.id} 
                  className="overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <OptimizedImage
                      src={getMainImageUrl(store)}
                      alt={store.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    
                    {/* Verification badge */}
                    <div className="absolute top-2 right-2">
                      {store.verified ? (
                        <Badge variant="default" className="flex items-center gap-1 bg-green-500 hover:bg-green-600">
                          <ShieldCheck className="w-3 h-3" />
                          Проверено
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1 bg-white/80">
                          Не проверено
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/stores/${store.id}`} 
                          className="hover:text-primary transition-colors truncate"
                          title={store.name}
                        >
                          {store.name}
                        </Link>
                        {store.verified && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Проверенный магазин</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="flex items-center flex-shrink-0 ml-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="text-sm font-medium">
                          {store.rating?.toFixed(1) || '-'}
                        </span>
                      </div>
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm">
                      {store.description || 'Описание отсутствует'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-2 flex-grow pt-0">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate" title={store.address}>
                        {store.address}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Package className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span>{store.product_count || 0} объявлений</span>
                    </div>
                    
                    {store.tags && store.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {store.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs capitalize">
                            {tag.replace('_', ' ')}
                          </Badge>
                        ))}
                        {store.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{store.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="pt-3">
                    <Button asChild variant="outline" className="w-full hover:bg-primary hover:text-white transition-colors">
                      <Link to={`/stores/${store.id}`}>Подробнее</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <StoresPagination
              currentPage={currentPage}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
            />
          </>
        )}
      </div>
    </Layout>
  );
};

export default Stores;
