
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const channelRef = useRef<any>(null);
  const lastUpdateRef = useRef<number>(0);
  const DEBOUNCE_MS = 1000; // 1 second debounce

  useEffect(() => {
    if (!enabled || !productId) return;

    // Cleanup existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `price-offers-realtime-${productId}`;
    console.log(`🔄 Setting up real-time channel: ${channelName}`);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_offers',
          filter: `product_id=eq.${productId}`
        },
        (payload) => {
          const now = Date.now();
          
          // Debounce updates to prevent too frequent invalidations
          if (now - lastUpdateRef.current < DEBOUNCE_MS) {
            console.log('🔄 Debouncing real-time update');
            return;
          }
          
          lastUpdateRef.current = now;
          
          console.log('🔄 Real-time price offers update:', {
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
            }
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log(`🔄 Real-time subscription status for ${productId}:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Successfully subscribed to price offers updates for product ${productId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Channel error for product ${productId}, attempting to reconnect...`);
          // Attempt to reconnect after a delay
          setTimeout(() => {
            if (channelRef.current) {
              channelRef.current.unsubscribe();
              channelRef.current = null;
            }
          }, 2000);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log(`🔄 Cleaning up real-time channel for product ${productId}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, productId, userId, queryClient]);

  return channelRef.current;
};
