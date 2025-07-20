
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

// Interface for batch offer data
export interface BatchOfferData {
  product_id: string;
  max_offer_price: number;
  current_user_is_max: boolean;
  total_offers_count: number;
  current_user_offer_price: number;
  has_pending_offer: boolean;
}

// Hook for batch fetching offer data for multiple products
export const useBatchOffers = (productIds: string[], enabled = true) => {
  const { user } = useAuth();
  
  const uniqueProductIds = useMemo(() => {
    return Array.from(new Set(productIds.filter(Boolean)));
  }, [productIds]);

  return useQuery({
    queryKey: ["batch-offers", uniqueProductIds.sort(), user?.id],
    queryFn: async (): Promise<BatchOfferData[]> => {
      if (uniqueProductIds.length === 0) return [];

      console.log('🔄 Fetching batch offers for products:', uniqueProductIds);

      const { data, error } = await supabase.rpc("get_offers_batch", {
        p_product_ids: uniqueProductIds,
        p_user_id: user?.id || null,
      });

      if (error) {
        console.error("❌ Error fetching batch offers:", error);
        throw error;
      }

      console.log('✅ Batch offers fetched successfully:', {
        requestedProducts: uniqueProductIds.length,
        returnedOffers: data?.length || 0,
        sampleData: data?.slice(0, 3)
      });

      return data || [];
    },
    enabled: enabled && uniqueProductIds.length > 0,
    staleTime: 30000, // 30 seconds - longer cache for batch data
    gcTime: 300000, // 5 minutes garbage collection
    refetchOnWindowFocus: false, // Rely on real-time for updates
    refetchInterval: false, // Disable polling, use real-time instead
    retry: (failureCount) => {
      console.log(`🔄 Retrying batch offers fetch, attempt ${failureCount + 1}`);
      return failureCount < 2; // Retry up to 2 times
    },
  });
};

// Hook to get specific product data from batch
export const useProductOfferFromBatch = (
  productId: string, 
  batchData?: BatchOfferData[]
) => {
  return useMemo(() => {
    if (!batchData || !productId) {
      return {
        max_offer_price: 0,
        current_user_is_max: false,
        total_offers_count: 0,
        current_user_offer_price: 0,
        has_pending_offer: false,
      };
    }

    const productData = batchData.find(item => item.product_id === productId);
    
    if (!productData) {
      console.log('🔍 Product not found in batch data:', productId, 'Available products:', batchData.map(d => d.product_id));
      
      return {
        product_id: productId,
        max_offer_price: 0,
        current_user_is_max: false,
        total_offers_count: 0,
        current_user_offer_price: 0,
        has_pending_offer: false,
      };
    }

    console.log('✅ Found product data in batch:', productId, productData);
    return productData;
  }, [productId, batchData]);
};

// Hook for invalidating batch offers cache
export const useBatchOffersInvalidation = () => {
  const queryClient = useQueryClient();

  const invalidateBatchOffers = (productIds?: string[]) => {
    console.log('🔄 Invalidating batch offers for products:', productIds);
    
    if (productIds) {
      // Invalidate specific batch queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          if (!query.queryKey[0] || query.queryKey[0] !== "batch-offers") return false;
          const cachedProductIds = query.queryKey[1] as string[];
          return productIds.some(id => cachedProductIds?.includes(id));
        }
      });
    } else {
      // Invalidate all batch offer queries
      queryClient.invalidateQueries({ queryKey: ["batch-offers"] });
    }
    
    // Also invalidate individual queries for backward compatibility
    if (productIds) {
      productIds.forEach(productId => {
        queryClient.invalidateQueries({ queryKey: ["pending-offer", productId] });
        queryClient.invalidateQueries({ queryKey: ["competitive-offers", productId] });
      });
    }
  };

  return { invalidateBatchOffers };
};
