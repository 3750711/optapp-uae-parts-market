
import React, { useState, useRef, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import ProductGrid from "@/components/product/ProductGrid";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntersection } from "@/hooks/useIntersection";
import { Button } from "@/components/ui/button";

type Product = Database["public"]["Tables"]["products"]["Row"];

const Catalog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const productsPerPage = 8;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadMoreVisible = useIntersection(loadMoreRef, "300px");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ["products-infinite", searchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * productsPerPage;
      const to = from + productsPerPage - 1;
      
      console.log(`Fetching catalog products: ${from} to ${to}`);
      let query = supabase
        .from("products")
        .select("*, product_images(url, is_primary), profiles:seller_id(*)")
        .in('status', ['active', 'sold'])
        .order("created_at", { ascending: false });

      // Add search filter if there's a search query
      if (searchQuery) {
        query = query.or(
          `title.ilike.%${searchQuery}%,` +
          `brand.ilike.%${searchQuery}%,` +
          `model.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query.range(from, to);
      
      if (error) {
        console.error("Error fetching products:", error);
        throw new Error("Failed to fetch products");
      }
      
      return data || [];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === productsPerPage ? allPages.length : undefined;
    },
    initialPageParam: 0
  });

  // Effect to refetch when search query changes
  useEffect(() => {
    refetch();
  }, [searchQuery, refetch]);

  // Using both effect and manual trigger to ensure reliable loading
  useEffect(() => {
    if (isLoadMoreVisible && hasNextPage && !isFetchingNextPage) {
      console.log("Load more element is visible in catalog, fetching next page");
      fetchNextPage();
    }
  }, [isLoadMoreVisible, fetchNextPage, hasNextPage, isFetchingNextPage]);
  
  const handleLoadMoreClick = () => {
    if (hasNextPage && !isFetchingNextPage) {
      console.log("Manual load more triggered");
      fetchNextPage();
    }
  };

  const allProducts = data?.pages.flat() || [];
  console.log(`Total catalog products loaded: ${allProducts.length}`);

  const mappedProducts = allProducts.map(product => {
    let imageUrl = "https://images.unsplash.com/photo-1562687877-3c98ca2834c9?q=80&w=500&auto=format&fit=crop";
    if (product.product_images && product.product_images.length > 0) {
      const primaryImage = product.product_images.find(img => img.is_primary);
      if (primaryImage) {
        imageUrl = primaryImage.url;
      } else if (product.product_images[0]) {
        imageUrl = product.product_images[0].url;
      }
    }
    
    const sellerLocation = product.profiles?.location || product.location || "Dubai";
    
    return {
      id: product.id,
      name: product.title,
      price: Number(product.price),
      image: imageUrl,
      condition: product.condition as "Новый" | "Б/У" | "Восстановленный",
      location: sellerLocation,
      seller_opt_id: product.profiles?.opt_id,
      seller_rating: product.profiles?.rating,
      optid_created: product.optid_created,
      rating_seller: product.rating_seller,
      brand: product.brand,
      model: product.model,
      seller_name: product.seller_name,
      status: product.status,
      seller_id: product.seller_id,
      seller_verification: product.profiles?.verification_status,
      seller_opt_status: product.profiles?.opt_status,
      created_at: product.created_at,
      delivery_price: product.delivery_price
    };
  });

  return (
    <Layout>
      <div className="bg-lightGray min-h-screen py-0">
        <div className="container mx-auto px-3 pb-20 pt-8 sm:pt-14">
          <div className="mb-10 flex justify-center">
            <form onSubmit={(e) => e.preventDefault()} className="w-full max-w-xl flex items-center relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="h-5 w-5"/>
              </span>
              <input 
                type="text"
                placeholder="Поиск по названию, бренду, модели..." 
                className="flex-grow pl-11 pr-3 py-2 md:py-3 border border-gray-200 rounded-xl text-[#181920] bg-white focus:border-link focus:ring-2 focus:ring-link/10 transition-all duration-300 shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ borderRadius: 14, fontSize: "1rem" }}
              />
            </form>
          </div>
          
          {isLoading && (
            <div className="animate-pulse">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
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
          )}

          {isError && (
            <div className="text-center py-12">
              <p className="text-lg text-red-600">Ошибка при загрузке товаров</p>
              <Button 
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Попробовать снова
              </Button>
            </div>
          )}

          {!isLoading && !isError && allProducts.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-lg text-gray-800">Товары не найдены</p>
              <p className="text-gray-500 mt-2">Попробуйте изменить параметры поиска</p>
            </div>
          )}
          
          {!isLoading && allProducts.length > 0 && (
            <div className="animate-fade-in">
              <ProductGrid products={mappedProducts} />
            </div>
          )}
          
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

          {!hasNextPage && !isLoading && allProducts.length > 0 && (
            <div className="text-center py-8 text-gray-600">
              Вы просмотрели все доступные товары
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Catalog;
