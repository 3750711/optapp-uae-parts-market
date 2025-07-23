
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUnifiedRealtimeManager } from "./useUnifiedRealtimeManager";

interface UseRealTimePriceOffersProps {
  productId: string;
  enabled: boolean;
  userId?: string;
}

export const useRealTimePriceOffers = ({ 
  productId, 
  enabled, 
  userId 
}: UseRealTimePriceOffersProps) => {
  const queryClient = useQueryClient();
  const { subscribe } = useUnifiedRealtimeManager();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const DEBOUNCE_MS = 1000;

  useEffect(() => {
    if (!enabled || !productId) return;

    console.log(`🔄 Setting up unified real-time for product: ${productId}`);

    const unsubscribe = subscribe({
      id: `price-offers-${productId}`,
      table: 'price_offers',
      filter: `product_id=eq.${productId}`,
      enabled: true,
      callback: (payload) => {
        const now = Date.now();
        
        // Debounce updates to prevent too frequent invalidations
        if (now - lastUpdateRef.current < DEBOUNCE_MS) {
          console.log('🔄 Debouncing unified real-time update');
          return;
        }
        
        lastUpdateRef.current = now;
        
        console.log('🔄 Unified real-time price offers update:', {
          event: payload.eventType,
          productId,
          userId,
          payload
        });

        // Invalidate all related queries with slight delay to ensure consistency
        setTimeout(() => {
          queryClient.invalidateQueries({ 
            queryKey: ["pending-offer", productId] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ["competitive-offers", productId] 
          });
          
          // Also invalidate user's offer lists if userId is available
          if (userId) {
            queryClient.invalidateQueries({ 
              queryKey: ["buyer-price-offers"] 
            });
            queryClient.invalidateQueries({ 
              queryKey: ["buyer-auction-products"] 
            });
          }
        }, 100);
      }
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      console.log(`🔄 Cleaning up unified real-time for product ${productId}`);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [enabled, productId, userId, queryClient, subscribe]);

  return unsubscribeRef.current;
};
