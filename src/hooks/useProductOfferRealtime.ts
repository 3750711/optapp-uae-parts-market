
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBatchOffersInvalidation } from '@/hooks/use-price-offers-batch';

/**
 * Hook for real-time updates of product offer data
 * Listens to changes in price_offers and products tables
 * and invalidates relevant queries to trigger re-fetching
 */
export const useProductOfferRealtime = (productId?: string) => {
  const queryClient = useQueryClient();
  const { invalidateBatchOffers } = useBatchOffersInvalidation();

  useEffect(() => {
    if (!productId) return;

    const channel = supabase
      .channel(`product-offers-${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_offers',
          filter: `product_id=eq.${productId}`
        },
        (payload) => {
          console.log('🔄 Real-time price offer update:', payload);
          
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
          
          // Invalidate batch offers for this product
          invalidateBatchOffers([productId]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${productId}`
        },
        (payload) => {
          console.log('🔄 Real-time product update:', payload);
          
          // Invalidate product data when optimization fields change
          queryClient.invalidateQueries({ 
            queryKey: ['admin-products'] 
          });
          
          // Also invalidate batch offers since product data affects offer calculations
          invalidateBatchOffers([productId]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, queryClient, invalidateBatchOffers]);
};
