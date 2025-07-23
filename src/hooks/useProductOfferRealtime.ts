
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBatchOffersInvalidation } from '@/hooks/use-price-offers-batch';
import { useUnifiedRealtimeManager } from './useUnifiedRealtimeManager';

/**
 * Hook for real-time updates of product offer data
 * Uses unified real-time manager to prevent duplicate channels
 */
export const useProductOfferRealtime = (productId?: string) => {
  const queryClient = useQueryClient();
  const { invalidateBatchOffers } = useBatchOffersInvalidation();
  const { subscribe } = useUnifiedRealtimeManager();

  useEffect(() => {
    if (!productId) return;

    console.log(`🔄 Setting up unified product offer real-time for: ${productId}`);

    const unsubscribePriceOffers = subscribe({
      id: `product-offers-${productId}`,
      table: 'price_offers',
      filter: `product_id=eq.${productId}`,
      enabled: true,
      callback: (payload) => {
        console.log('🔄 Unified product offer real-time update:', {
          productId,
          event: payload.eventType,
          new: payload.new,
          old: payload.old,
          timestamp: new Date().toISOString()
        });
        
        // Invalidate individual offer queries
        queryClient.invalidateQueries({ 
          queryKey: ['pending-offer', productId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['competitive-offers', productId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['admin-products'] 
        });
        
        // Invalidate catalog queries for button updates
        queryClient.invalidateQueries({ 
          queryKey: ['products-infinite-optimized'] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['catalog-products'] 
        });
        
        console.log('✅ Invalidated catalog queries for product', productId);
        
        // Invalidate batch offers for this product
        invalidateBatchOffers([productId]);
      }
    });

    const unsubscribeProducts = subscribe({
      id: `product-updates-${productId}`,
      table: 'products',
      filter: `id=eq.${productId}`,
      enabled: true,
      callback: (payload) => {
        console.log('🔄 Unified product update:', {
          productId,
          new: payload.new,
          old: payload.old,
          timestamp: new Date().toISOString()
        });
        
        // Invalidate product data when optimization fields change
        queryClient.invalidateQueries({ 
          queryKey: ['admin-products'] 
        });
        
        // Invalidate catalog queries for product updates
        queryClient.invalidateQueries({ 
          queryKey: ['products-infinite-optimized'] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['catalog-products'] 
        });
        
        console.log('✅ Invalidated catalog queries for product update', productId);
        
        // Also invalidate batch offers since product data affects offer calculations
        invalidateBatchOffers([productId]);
      }
    });

    return () => {
      console.log(`🔌 Cleaning up unified product offer real-time for: ${productId}`);
      unsubscribePriceOffers();
      unsubscribeProducts();
    };
  }, [productId, queryClient, invalidateBatchOffers, subscribe]);
};
