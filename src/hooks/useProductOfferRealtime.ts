import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for real-time updates of product offer data
 * Listens to changes in price_offers and products tables
 * and invalidates relevant queries to trigger re-fetching
 */
export const useProductOfferRealtime = (productId?: string) => {
  const queryClient = useQueryClient();

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
        () => {
          // Invalidate offer-related queries for this product
          queryClient.invalidateQueries({ 
            queryKey: ['pending-offer', productId] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['competitive-offers', productId] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['admin-products'] 
          });
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
        () => {
          // Invalidate product data when optimization fields change
          queryClient.invalidateQueries({ 
            queryKey: ['admin-products'] 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, queryClient]);
};