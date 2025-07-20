
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

// Оптимизированный hook для batch fetching offer data для множественных продуктов
export const useBatchOffers = (productIds: string[], enabled = true) => {
  const { user } = useAuth();
  
  const uniqueProductIds = useMemo(() => {
    return Array.from(new Set(productIds.filter(Boolean)));
  }, [productIds]);

  return useQuery({
    queryKey: ["batch-offers", uniqueProductIds.sort(), user?.id],
    queryFn: async (): Promise<BatchOfferData[]> => {
      if (uniqueProductIds.length === 0) return [];

      console.log('🚀 Fetching optimized batch offers for products:', uniqueProductIds.length);

      const { data, error } = await supabase.rpc("get_offers_batch", {
        p_product_ids: uniqueProductIds,
        p_user_id: user?.id || null,
      });

      if (error) {
        console.error("❌ Error fetching batch offers:", error);
        throw error;
      }

      console.log('✅ Optimized batch offers fetched successfully:', {
        requestedProducts: uniqueProductIds.length,
        returnedOffers: data?.length || 0,
        performance: `${data?.length || 0} products in single query`
      });

      return data || [];
    },
    enabled: enabled && uniqueProductIds.length > 0,
    staleTime: 15000, // Уменьшено с 30 до 15 секунд для более свежих данных
    gcTime: 180000, // Уменьшено с 300 до 180 секунд (3 минуты)
    refetchOnWindowFocus: true, // Включено для актуальности данных
    refetchInterval: false, // Полагаемся на real-time для обновлений
    retry: (failureCount, error) => {
      console.log(`🔄 Retrying optimized batch offers fetch, attempt ${failureCount + 1}`, error);
      return failureCount < 3; // Увеличено до 3 попыток
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Экспоненциальная задержка
  });
};

// Hook для получения данных конкретного продукта из batch
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

    console.log('✅ Found product data in optimized batch:', productId, productData);
    return productData;
  }, [productId, batchData]);
};

// Hook для селективной инвалидации batch offers cache
export const useBatchOffersInvalidation = () => {
  const queryClient = useQueryClient();

  const invalidateBatchOffers = (productIds?: string[]) => {
    console.log('🔄 Invalidating optimized batch offers for products:', productIds);
    
    if (productIds && productIds.length > 0) {
      // Селективная инвалидация - только для query с пересекающимися продуктами
      queryClient.invalidateQueries({
        predicate: (query) => {
          if (!query.queryKey[0] || query.queryKey[0] !== "batch-offers") return false;
          const cachedProductIds = query.queryKey[1] as string[];
          if (!cachedProductIds) return false;
          
          // Инвалидируем если есть пересечение с обновленными продуктами
          return productIds.some(id => cachedProductIds.includes(id));
        }
      });
      
      // Также инвалидируем индивидуальные queries для обратной совместимости
      productIds.forEach(productId => {
        queryClient.invalidateQueries({ queryKey: ["pending-offer", productId] });
        queryClient.invalidateQueries({ queryKey: ["competitive-offers", productId] });
      });
    } else {
      // Полная инвалидация всех batch offer queries
      queryClient.invalidateQueries({ queryKey: ["batch-offers"] });
    }
    
    console.log('✅ Optimized batch offers invalidated');
  };

  return { invalidateBatchOffers };
};
