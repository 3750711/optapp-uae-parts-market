
import React, { useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductGrid from "@/components/product/ProductGrid";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";
import { ProductProps } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useIntersection } from "@/hooks/useIntersection";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EnhancedSellerListingsSkeleton from "@/components/seller/EnhancedSellerListingsSkeleton";

const SellerListingsContent = () => {
  const { user } = useAuth();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadMoreVisible = useIntersection(loadMoreRef, "300px");
  const productsPerPage = 12; // Increased for better performance
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['seller-products-infinite', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const from = pageParam * productsPerPage;
      const to = from + productsPerPage - 1;
      
      console.log(`Fetching seller products: ${from} to ${to}`);
      
      // Optimized query - only select necessary fields and use preview_url
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          price,
          brand,
          model,
          status,
          created_at,
          seller_name,
          delivery_price,
          optid_created,
          lot_number,
          product_images!inner(
            url,
            is_primary,
            preview_url
          )
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Ошибка загрузки товаров: ${error.message}`);
      }
      
      return data as Product[];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === productsPerPage ? allPages.length : undefined;
    },
    initialPageParam: 0,
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Effect to fetch next page when intersection observer detects the load more element
  useEffect(() => {
    if (isLoadMoreVisible && hasNextPage && !isFetchingNextPage && !isError) {
      console.log("Load more element is visible, fetching next page");
      fetchNextPage();
    }
  }, [isLoadMoreVisible, fetchNextPage, hasNextPage, isFetchingNextPage, isError]);

  // Manual load more function with error handling
  const handleLoadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      try {
        console.log("Manual load more triggered");
        await fetchNextPage();
      } catch (error) {
        console.error('Error loading more products:', error);
        toast({
          variant: "destructive",
          title: "Ошибка загрузки",
          description: "Не удалось загрузить больше товаров",
        });
      }
    }
  };

  const handleRetry = async () => {
    try {
      await refetch();
      toast({
        title: "Обновление данных",
        description: "Загружаем ваши товары...",
      });
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  // Flatten the pages into a single array of products
  const allProducts = data?.pages.flat() || [];
  console.log(`Total seller products loaded: ${allProducts.length}`);

  const mappedProducts: ProductProps[] = allProducts.map(product => {
    // Optimized image handling with preview_url priority
    const primaryImage = product.product_images?.find(img => img.is_primary);
    const fallbackImage = product.product_images?.[0];
    
    const imageUrl = primaryImage?.url || fallbackImage?.url || '/placeholder.svg';
    const previewUrl = primaryImage?.preview_url || fallbackImage?.preview_url;
    
    return {
      id: product.id,
      title: product.title,
      price: Number(product.price),
      image: imageUrl,
      preview_image: previewUrl,
      brand: product.brand || '',
      model: product.model || '',
      seller_name: product.seller_name,
      status: product.status,
      seller_id: user?.id,
      delivery_price: product.delivery_price,
      optid_created: product.optid_created,
      lot_number: product.lot_number
    };
  });

  // Enhanced loading state
  if (isLoading) {
    return <EnhancedSellerListingsSkeleton />;
  }

  // Enhanced error state with retry
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Мои объявления</h1>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <div className="font-medium mb-1">Ошибка загрузки товаров</div>
              <div className="text-sm">
                {error instanceof Error ? error.message : 'Неизвестная ошибка'}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
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
          <ProductGrid products={mappedProducts} showAllStatuses={true} />
          
          {/* Enhanced load more with error handling */}
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
                    disabled={isError}
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
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="max-w-md mx-auto">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              У вас пока нет объявлений
            </h3>
            <p className="text-gray-600 mb-6">
              Начните продавать, создав свое первое объявление
            </p>
            <Button asChild>
              <a href="/seller/add-product">
                Добавить товар
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerListingsContent;
