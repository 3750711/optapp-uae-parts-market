import React from 'react';
import { useOptimizedCatalogProducts } from '@/hooks/useOptimizedCatalogProducts';
import { SimplifiedProductCard } from '@/components/product/SimplifiedProductCard';
import SearchControls from '@/components/catalog/SearchControls';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

export const HomeProductsSection: React.FC = () => {
  const {
    searchTerm,
    hideSoldProducts,
    setHideSoldProducts,
    mappedProducts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    handleSearch,
    handleClearSearch,
    refetch,
    totalProductsCount
  } = useOptimizedCatalogProducts({
    productsPerPage: 12,
  });

  const handleClearSoldFilter = () => {
    setHideSoldProducts(false);
  };

  const handleClearAll = () => {
    handleClearSearch();
    setHideSoldProducts(false);
  };

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Произошла ошибка при загрузке товаров</p>
        <Button onClick={() => refetch()} variant="outline">
          Попробовать снова
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <SearchControls 
        searchTerm={searchTerm}
        onSearch={handleSearch}
        hideSoldProducts={hideSoldProducts}
        setHideSoldProducts={setHideSoldProducts}
        isSearching={isLoading}
        onClearSearch={handleClearSearch}
        onClearSoldFilter={handleClearSoldFilter}
        onClearAll={handleClearAll}
      />

      {/* Products Count */}
      {!isLoading && mappedProducts.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Найдено товаров: <span className="font-semibold text-foreground">{totalProductsCount}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Загрузка товаров...</span>
        </div>
      ) : mappedProducts.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-2">Товары не найдены</p>
          <p className="text-sm text-muted-foreground">Попробуйте изменить параметры поиска</p>
        </div>
      ) : (
        /* Products Grid */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mappedProducts.map(product => (
              <SimplifiedProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Load More Button */}
          {hasNextPage && (
            <div className="flex justify-center pt-6">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                variant="secondary"
                size="lg"
                className="min-w-[200px]"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Загрузить ещё
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
