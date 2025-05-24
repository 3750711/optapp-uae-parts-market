
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import VirtualizedProductGrid from '@/components/product/VirtualizedProductGrid';
import RequestPartsPromo from '@/components/catalog/RequestPartsPromo';
import ProductSkeleton from '@/components/catalog/ProductSkeleton';
import { useIntersection } from '@/hooks/useIntersection';
import { ProductProps } from '@/components/product/ProductCard';

interface ProductsSectionProps {
  isLoading: boolean;
  isError: boolean;
  hasSearched: boolean;
  debouncedSearchQuery: string;
  selectedBrand: string | null;
  selectedModel: string | null;
  allProducts: any[];
  productChunks: ProductProps[][];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

const ProductsSection: React.FC<ProductsSectionProps> = ({
  isLoading,
  isError,
  hasSearched,
  debouncedSearchQuery,
  selectedBrand,
  selectedModel,
  allProducts,
  productChunks,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch
}) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadMoreVisible = useIntersection(loadMoreRef, "300px");
  
  React.useEffect(() => {
    if (isLoadMoreVisible && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isLoadMoreVisible, fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleLoadMoreClick = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-red-600">Ошибка при загрузке товаров</p>
        <Button 
          onClick={() => refetch()}
          className="mt-4"
        >
          Попробовать снова
        </Button>
      </div>
    );
  }

  // No results found
  if (!isLoading && !isError && hasSearched && 
      (debouncedSearchQuery || selectedBrand || selectedModel) && 
      allProducts.length === 0) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <p className="text-lg text-gray-800">Товары не найдены</p>
        <p className="text-gray-500 mt-2">Попробуйте изменить параметры поиска</p>
        
        {/* Show RequestPartsPromo when no search results are found */}
        <div className="mt-10">
          <RequestPartsPromo />
        </div>
      </div>
    );
  }
  
  // Use virtualized grid for large product lists
  if (!isLoading && allProducts.length > 0) {
    const flatProducts = productChunks.flat();
    
    return (
      <div className="animate-fade-in space-y-12">
        {/* Use virtualization for better performance */}
        <VirtualizedProductGrid 
          products={flatProducts}
          containerHeight={800}
        />
        
        {/* Show RequestPartsPromo after products when search was performed */}
        {hasSearched && (
          <div className="mt-6">
            <RequestPartsPromo />
          </div>
        )}
        
        {/* Load more section */}
        {(hasNextPage || isFetchingNextPage) && (
          <div className="mt-8 flex flex-col items-center justify-center">
            <div 
              ref={loadMoreRef} 
              className="h-20 w-full flex items-center justify-center"
            >
              {isFetchingNextPage ? (
                <div className="flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-t-link rounded-full animate-spin"></div>
                  <span className="ml-3 text-muted-foreground">Загрузка товаров...</span>
                </div>
              ) : (
                <Button 
                  onClick={handleLoadMoreClick}
                  className="bg-primary hover:bg-primary/90"
                >
                  Загрузить ещё
                </Button>
              )}
            </div>
          </div>
        )}

        {/* End of results message */}
        {!hasNextPage && !isLoading && allProducts.length > 0 && (
          <div className="text-center py-8 text-gray-600">
            Вы просмотрели все доступные товары
          </div>
        )}
      </div>
    );
  }
  
  return null;
};

export default ProductsSection;
