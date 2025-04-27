
import React, { useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductGrid from "@/components/product/ProductGrid";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";
import { ProductProps } from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntersection } from "@/hooks/useIntersection";
import { Button } from "@/components/ui/button";

const SellerListingsContent = () => {
  const { user } = useAuth();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadMoreVisible = useIntersection(loadMoreRef, "300px");
  const productsPerPage = 8;
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: ['seller-products-infinite', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * productsPerPage;
      const to = from + productsPerPage - 1;
      
      console.log(`Fetching seller products: ${from} to ${to}`);
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(url, is_primary)')
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return data as Product[];
    },
    getNextPageParam: (lastPage, allPages) => {
      // Only return next page if we got a full page of results
      return lastPage.length === productsPerPage ? allPages.length : undefined;
    },
    initialPageParam: 0,
    enabled: !!user?.id,
  });

  // Effect to fetch next page when intersection observer detects the load more element
  useEffect(() => {
    if (isLoadMoreVisible && hasNextPage && !isFetchingNextPage) {
      console.log("Load more element is visible in seller listings, fetching next page");
      fetchNextPage();
    }
  }, [isLoadMoreVisible, fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Add manual load more function
  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      console.log("Manual load more triggered in seller listings");
      fetchNextPage();
    }
  };

  const handleStatusChange = () => {
    refetch();
  };

  // Flatten the pages into a single array of products
  const allProducts = data?.pages.flat() || [];
  console.log(`Total seller products loaded: ${allProducts.length}`);

  const mappedProducts: ProductProps[] = allProducts.map(product => {
    const primaryImage = product.product_images?.find(img => img.is_primary)?.url || 
                        product.product_images?.[0]?.url || 
                        '/placeholder.svg';
    
    return {
      id: product.id,
      name: product.title,
      price: Number(product.price),
      image: primaryImage,
      location: product.location || '',
      brand: product.brand || '',
      model: product.model || '',
      seller_name: product.seller_name,
      status: product.status,
      seller_rating: product.rating_seller,
      optid_created: product.optid_created,
      seller_id: product.seller_id,
      onStatusChange: handleStatusChange,
      delivery_price: product.delivery_price
    };
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Мои объявления</h1>
          <Badge variant="outline" className="text-lg">
            Загрузка...
          </Badge>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-card overflow-hidden">
                <Skeleton className="h-[240px] w-full" />
                <div className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Мои объявления</h1>
        <Badge variant="outline" className="text-lg">
          Всего: {mappedProducts.length}
        </Badge>
      </div>
      {mappedProducts.length > 0 ? (
        <>
          <ProductGrid products={mappedProducts} />
          
          {/* Load more with both scroll trigger and button */}
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
                    onClick={handleLoadMore}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Загрузить ещё
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {!hasNextPage && !isFetchingNextPage && mappedProducts.length > 0 && (
            <div className="text-center py-6 text-gray-500">
              Вы просмотрели все ваши объявления
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-lg text-gray-600">У вас пока нет объявлений</p>
        </div>
      )}
    </div>
  );
};

export default SellerListingsContent;
