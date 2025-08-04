
import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useInfiniteQuery, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductGrid from "@/components/product/ProductGrid";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";
import { ProductProps } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useIntersection } from "@/hooks/useIntersection";
import { AlertTriangle, RefreshCw, Search, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import EnhancedSellerListingsSkeleton from "@/components/seller/EnhancedSellerListingsSkeleton";
import { devLog, devError, prodError, throttledDevLog } from "@/utils/logger";
import { BatchOfferData } from "@/hooks/use-price-offers-batch";
const SellerListingsContent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadMoreVisible = useIntersection(loadMoreRef, "300px");
  const productsPerPage = 12;
  
  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  
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
    queryKey: ['seller-products-infinite', user?.id, activeSearch],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) {
        prodError('User not authenticated in seller listings');
        throw new Error('User not authenticated');
      }
      
      const from = pageParam * productsPerPage;
      const to = from + productsPerPage - 1;
      
      devLog(`📦 Fetching seller products: ${from} to ${to} for user ${user.id}`);
      
      try {
        // Test connection first
        const { error: connectionError } = await supabase
          .from('products')
          .select('count')
          .limit(1);
          
        if (connectionError) {
          prodError('Database connection error in seller listings', { error: connectionError });
          throw new Error(`Connection error: ${connectionError.message}`);
        }
        
        let query = supabase
          .from('products')
          .select(`
            id,
            title,
            price,
            brand,
            model,
            status,
            created_at,
            delivery_price,
            optid_created,
            lot_number,
            place_number,
            product_images(
              url,
              is_primary
            )
          `)
          .eq('seller_id', user.id);

        // Add search filters
        if (activeSearch.trim()) {
          const searchTerm = activeSearch.trim();
          
          // Check if it's a number (lot/place search)
          if (/^\d+$/.test(searchTerm)) {
            const numberValue = parseInt(searchTerm);
            query = query.or(`lot_number.eq.${numberValue},place_number.eq.${numberValue}`);
          } else {
            // Text search in title, brand, model
            query = query.or(`title.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%`);
          }
        }

        const { data, error } = await query
          .order(`
            CASE status 
              WHEN 'active' THEN 1 
              WHEN 'pending' THEN 2 
              WHEN 'sold' THEN 3 
              WHEN 'archived' THEN 4 
              ELSE 5 
            END ASC,
            created_at DESC
          `)
          .range(from, to);

        if (error) {
          prodError('Database error in seller listings', { error });
          throw new Error(`Error loading products: ${error.message}`);
        }
        
        devLog(`✅ Successfully fetched ${data?.length || 0} products`);
        return data as Product[];
      } catch (dbError) {
        prodError('Error in seller products query', { error: dbError });
        throw dbError;
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === productsPerPage ? allPages.length : undefined;
    },
    initialPageParam: 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: (failureCount, error) => {
      throttledDevLog('seller-retry', `🔄 Seller products retry attempt ${failureCount}:`, error);
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Search handlers
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput);
  };


  const handleStatusChange = async () => {
    devLog("Product status changed, applying optimistic update");
    
    toast({
      title: "Status updated",
      description: "Changes applied",
    });
    queryClient.invalidateQueries({
      queryKey: ['seller-products-infinite', user?.id, activeSearch],
      refetchType: 'none'
    });
    setTimeout(() => {
      queryClient.refetchQueries({
        queryKey: ['seller-products-infinite', user?.id, activeSearch],
        type: 'active'
      });
    }, 1000);
  };

  useEffect(() => {
    if (isLoadMoreVisible && hasNextPage && !isFetchingNextPage && !isError) {
      devLog("Load more element is visible, fetching next page");
      fetchNextPage();
    }
  }, [isLoadMoreVisible, fetchNextPage, hasNextPage, isFetchingNextPage, isError]);

  const handleLoadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      try {
        devLog("Manual load more triggered");
        await fetchNextPage();
      } catch (error) {
        prodError('Error loading more products', { error });
        toast({
          variant: "destructive",
          title: "Loading error",
          description: "Failed to load more products",
        });
      }
    }
  };

  const handleRetry = async () => {
    try {
      devLog('🔄 Retrying seller products fetch...');
      await refetch();
      toast({
        title: "Updating data",
        description: "Loading your products...",
      });
    } catch (error) {
      prodError('Retry failed in seller listings', { error });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update data",
      });
    }
  };

  // Handle errors with detailed logging
  useEffect(() => {
    if (isError && error) {
      prodError('Seller listings error', { error });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        variant: "destructive",
        title: "Error loading products",
        description: errorMessage,
      });
    }
  }, [isError, error]);

  const allProducts = data?.pages.flat() || [];
  throttledDevLog('seller-stats', `📊 Total seller products loaded: ${allProducts.length}`);

  // Get product IDs for offers query
  const productIds = React.useMemo(() => 
    allProducts.map(product => product.id), 
    [allProducts]
  );

  // Fetch offers data directly from price_offers table
  const { data: offersData } = useQuery({
    queryKey: ['seller-product-offers', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('price_offers')
        .select(`
          id,
          product_id,
          offered_price,
          status,
          buyer_id,
          created_at
        `)
        .in('product_id', productIds)
        .order('offered_price', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: productIds.length > 0,
    staleTime: 30000,
  });

  // Convert offers data to batch format for compatibility
  const batchOffersData = React.useMemo(() => {
    if (!offersData || offersData.length === 0) return [];
    
    const grouped = offersData.reduce((acc, offer) => {
      const productId = offer.product_id;
      if (!acc[productId]) {
        acc[productId] = {
          product_id: productId,
          max_offer_price: 0,
          current_user_is_max: false,
          total_offers_count: 0,
          current_user_offer_price: 0,
          has_pending_offer: false,
        };
      }
      
      const group = acc[productId];
      group.total_offers_count++;
      
      if (offer.offered_price > group.max_offer_price) {
        group.max_offer_price = offer.offered_price;
      }
      
      if (offer.status === 'pending') {
        group.has_pending_offer = true;
      }
      
      return acc;
    }, {} as Record<string, BatchOfferData>);
    
    return Object.values(grouped) as BatchOfferData[];
  }, [offersData]);

  const mappedProducts: ProductProps[] = React.useMemo(() => {
    try {
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
          status: product.status,
          seller_id: user?.id,
          delivery_price: product.delivery_price,
          optid_created: product.optid_created,
          lot_number: product.lot_number,
          place_number: product.place_number
        };
      });
    } catch (mappingError) {
      devError('Error mapping seller products:', mappingError);
      return [];
    }
  }, [allProducts, user?.id]);

  if (isLoading) {
    return <EnhancedSellerListingsSkeleton />;
  }

  if (isError) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">My SHOP</h1>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <div className="font-medium mb-1">Error loading products</div>
              <div className="text-sm">{errorMessage}</div>
              <div className="text-xs mt-1 opacity-75">
                Check your internet connection and try again
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/seller/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">My SHOP</h1>
        </div>
      </div>
      
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title, brand, model or lot/place number..."
                className="w-full pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
          {activeSearch && (
            <div className="mt-3 text-sm text-muted-foreground">
              {/^\d+$/.test(activeSearch) ? (
                <span>Search by lot/place number: {activeSearch}</span>
              ) : (
                <span>Text search: "{activeSearch}"</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {mappedProducts.length > 0 ? (
        <>
          <ProductGrid
            products={mappedProducts} 
            showAllStatuses={true}
            showSoldButton={true}
            onStatusChange={handleStatusChange}
            batchOffersData={batchOffersData}
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
                    <span className="ml-3 text-muted-foreground">Loading products...</span>
                  </div>
                ) : (
                  <Button 
                    onClick={handleLoadMore}
                    className="bg-primary hover:bg-primary/90"
                    disabled={isError}
                  >
                    Load More
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {!hasNextPage && !isFetchingNextPage && mappedProducts.length > 0 && (
            <div className="text-center py-6 text-gray-500">
              You have viewed all your listings
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
              You don't have any listings yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first listing to start selling
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerListingsContent;
