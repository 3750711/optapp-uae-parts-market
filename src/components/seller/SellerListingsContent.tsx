
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from '@/hooks/useLanguage';
import { getSellerListingsPageTranslations } from '@/utils/translations/sellerListingsPage';
import { getCommonTranslations } from '@/utils/translations/common';
import ProductGrid from "@/components/product/ProductGrid";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";
import { ProductProps } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { AlertTriangle, RefreshCw, Search, ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import EnhancedSellerListingsSkeleton from "@/components/seller/EnhancedSellerListingsSkeleton";
import { devLog, devError, prodError, throttledDevLog } from "@/utils/logger";
import { BatchOfferData } from "@/hooks/use-price-offers-batch";
import ContactButtons from './ContactButtons';
import { usePublicProfileShare } from '@/hooks/usePublicProfileShare';
const SellerListingsContent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const t = getSellerListingsPageTranslations(language);
  const c = getCommonTranslations(language);
  const ITEMS_PER_PAGE = 12;
  
  // Public sharing functionality
  const { 
    generatePublicLink, 
    disablePublicAccess, 
    isGenerating, 
    isDisabling 
  } = usePublicProfileShare();
  
  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  
  // Store data for share functionality
  const { data: storeInfo } = useQuery({
    queryKey: ['seller-store-info', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not found');
      
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, phone, telegram, public_share_token, public_share_enabled')
        .eq('seller_id', user.id)
        .maybeSingle();
        
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Profile data for share functionality 
  const { data: profileInfo } = useQuery({
    queryKey: ['seller-profile-info', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not found');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, public_share_token, public_share_enabled')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
  
  // Fetch all seller products at once
  const {
    data: allProducts,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['seller-products', user?.id, activeSearch],
    queryFn: async () => {
      if (!user?.id) {
        prodError('User not authenticated in seller listings');
        throw new Error('User not authenticated');
      }
      
      devLog(`📦 Fetching all seller products for user ${user.id}`);
      
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
            catalog_position,
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

        const { data, error } = await query;

        if (error) {
          prodError('Database error in seller listings', { error });
          throw new Error(`Error loading products: ${error.message}`);
        }
        
        // Sort by status priority (pending first), then by creation date
        const sortedData = data?.sort((a, b) => {
          // Define status priority  
          const statusPriority = {
            'pending': 1,
            'active': 2,
            'sold': 3,
            'archived': 4
          };
          
          const aPriority = statusPriority[a.status as keyof typeof statusPriority] || 5;
          const bPriority = statusPriority[b.status as keyof typeof statusPriority] || 5;
          
          // First sort by status priority
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          
          // Then sort by creation date (newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }) || [];
        
        devLog(`✅ Successfully fetched and sorted ${sortedData?.length || 0} products`);
        return sortedData as Product[];
      } catch (dbError) {
        prodError('Error in seller products query', { error: dbError });
        throw dbError;
      }
    },
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
  
  // Reset current page when search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [activeSearch]);

  // Search handlers
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput);
  };


  const handleStatusChange = async () => {
    devLog("Product status changed, applying optimistic update");
    
    toast({
      title: t.statusUpdated,
      description: t.changesApplied,
    });
    queryClient.invalidateQueries({
      queryKey: ['seller-products', user?.id, activeSearch],
      refetchType: 'none'
    });
    setTimeout(() => {
      queryClient.refetchQueries({
        queryKey: ['seller-products', user?.id, activeSearch],
        type: 'active'
      });
    }, 1000);
  };

  const handleRepostSuccess = () => {
    devLog("Product repost successful, refreshing data");
    
    // Invalidate and refetch to get updated last_notification_sent_at
    queryClient.invalidateQueries({
      queryKey: ['seller-products', user?.id, activeSearch]
    });
    
    setTimeout(() => {
      queryClient.refetchQueries({
        queryKey: ['seller-products', user?.id, activeSearch],
        type: 'active'
      });
    }, 500);
  };

  const handleRetry = async () => {
    try {
      devLog('🔄 Retrying seller products fetch...');
      await refetch();
      toast({
        title: t.updatingData,
        description: t.loadingProducts,
      });
    } catch (error) {
      prodError('Retry failed in seller listings', { error });
      toast({
        variant: "destructive",
        title: "Error",
        description: t.failedToUpdate,
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
        title: t.errorLoadingProducts,
        description: errorMessage,
      });
    }
  }, [isError, error]);

  throttledDevLog('seller-stats', `📊 Total seller products loaded: ${allProducts?.length || 0}`);

  // Get current page products
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageProducts = allProducts?.slice(startIndex, endIndex) || [];
  const totalPages = Math.ceil((allProducts?.length || 0) / ITEMS_PER_PAGE);

  // Get product IDs for offers query
  const productIds = React.useMemo(() => 
    allProducts?.map(product => product.id) || [], 
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

  // Get mapped products for current page
  const mappedProducts: ProductProps[] = React.useMemo(() => {
    try {
      return currentPageProducts.map(product => {
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
          place_number: product.place_number,
          last_notification_sent_at: product.last_notification_sent_at
        };
      });
    } catch (mappingError) {
      devError('Error mapping seller products:', mappingError);
      return [];
    }
  }, [currentPageProducts, user?.id]);
  
  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (isLoading) {
    return <EnhancedSellerListingsSkeleton />;
  }

  if (isError) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t.myShop}</h1>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <div className="font-medium mb-1">{t.errorLoadingProducts}</div>
              <div className="text-sm">{errorMessage}</div>
              <div className="text-xs mt-1 opacity-75">
                {t.checkConnection}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t.retry}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">{t.myShop}</h1>
          <ContactButtons
            sellerId={user?.id}
            sellerName={storeInfo?.name || profileInfo?.display_name || 
              `${profileInfo?.first_name || ''} ${profileInfo?.last_name || ''}`.trim() || 
              'My Store'}
            storeInfo={storeInfo}
            profileInfo={profileInfo}
          />
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
                placeholder={t.searchPlaceholder}
                className="w-full pl-10"
              />
            </div>
            <Button type="submit">{t.search}</Button>
          </form>
          {activeSearch && (
            <div className="mt-3 text-sm text-muted-foreground">
              {/^\d+$/.test(activeSearch) ? (
                <span>{t.searchByLotPlace}: {activeSearch}</span>
              ) : (
                <span>{t.textSearch}: "{activeSearch}"</span>
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
            onRepostSuccess={handleRepostSuccess}
            batchOffersData={batchOffersData}
          />
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <div className="text-sm text-muted-foreground">
                {t.showingResults} {startIndex + 1}-{Math.min(endIndex, allProducts?.length || 0)} {t.of} {allProducts?.length || 0} {t.products}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t.previous}
                </Button>
                
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">
                    {t.page} {currentPage + 1} {t.of} {totalPages}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages - 1}
                  className="flex items-center gap-1"
                >
                  {t.next}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
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
              {t.noListingsYet}
            </h3>
            <p className="text-gray-500 mb-6">
              {t.createFirstListing}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerListingsContent;
