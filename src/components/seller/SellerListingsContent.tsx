
import React, { useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadMoreVisible = useIntersection(loadMoreRef, "300px");
  const productsPerPage = 12;
  
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
          product_images(
            url,
            is_primary
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
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const handleStatusChange = async () => {
    console.log("Product status changed, applying optimistic update");
    
    toast({
      title: "Статус обновлен",
      description: "Изменения применены",
    });

    queryClient.invalidateQueries({
      queryKey: ['seller-products-infinite', user?.id],
      refetchType: 'none'
    });

    setTimeout(() => {
      queryClient.refetchQueries({
        queryKey: ['seller-products-infinite', user?.id],
        type: 'active'
      });
    }, 1000);
  };

  useEffect(() => {
    if (isLoadMoreVisible && hasNextPage && !isFetchingNextPage && !isError) {
      console.log("Load more element is visible, fetching next page");
      fetchNextPage();
    }
  }, [isLoadMoreVisible, fetchNextPage, hasNextPage, isFetchingNextPage, isError]);

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

  const allProducts = data?.pages.flat() || [];
  console.log(`Total seller products loaded: ${allProducts.length}`);

  const mappedProducts: ProductProps[] = React.useMemo(() => {
    return allProducts.map(product => {
      const images = product.product_images || [];
      const primaryImage = images.find(img => img.is_primary);
      const fallbackImage = images[0];
      
      const imageUrl = primaryImage?.url || fallbackImage?.url || '/placeholder.svg';
      
      return {
        id: product.id,
        title: product.title,
        price: Number(product.price),
        image: imageUrl,
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
  }, [allProducts, user?.id]);

  if (isLoading) {
    return <EnhancedSellerListingsSkeleton />;
  }

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
          <ProductGrid 
            products={mappedProducts} 
            showAllStatuses={true}
            showSoldButton={true}
            onStatusChange={handleStatusChange}
          />
          
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
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              У вас пока нет объявлений
            </h3>
            <p className="text-gray-500 mb-6">
              Создайте свое первое объявление, чтобы начать продавать
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerListingsContent;
