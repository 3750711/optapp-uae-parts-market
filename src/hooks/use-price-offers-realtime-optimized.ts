import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBatchOffersInvalidation } from "./use-price-offers-batch";

interface UseGlobalRealTimePriceOffersProps {
  enabled: boolean;
  userId?: string;
}

// Global real-time hook for all price offers
export const useGlobalRealTimePriceOffers = ({ 
  enabled, 
  userId 
}: UseGlobalRealTimePriceOffersProps) => {
  const queryClient = useQueryClient();
  const { invalidateBatchOffers } = useBatchOffersInvalidation();
  const channelRef = useRef<any>(null);
  const lastUpdateRef = useRef<number>(0);
  const pendingUpdatesRef = useRef<Set<string>>(new Set());
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  
  const DEBOUNCE_MS = 3000; // 3 second debounce for stability

  const processPendingUpdates = useCallback(() => {
    const productIds = Array.from(pendingUpdatesRef.current);
    if (productIds.length === 0) return;

    console.log('🔄 Processing batch real-time updates for products:', productIds);
    
    // Invalidate batch offers for affected products
    invalidateBatchOffers(productIds);
    
    // Also invalidate user's offer lists if userId is available
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ["buyer-price-offers"] });
      queryClient.invalidateQueries({ queryKey: ["seller-price-offers"] });
    }
    
    // Clear pending updates
    pendingUpdatesRef.current.clear();
  }, [invalidateBatchOffers, queryClient, userId]);

  useEffect(() => {
    if (!enabled) return;

    // Cleanup existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = 'global-price-offers-realtime';
    console.log(`🔄 Setting up global real-time channel: ${channelName}`);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_offers'
        },
        (payload) => {
          const now = Date.now();
          
          // Extract product_id from payload
          const productId = payload.new?.product_id || payload.old?.product_id;
          if (!productId) return;

          console.log('🔄 Global real-time price offers update:', {
            event: payload.eventType,
            productId,
            userId,
            payload
          });

          // Add to pending updates
          pendingUpdatesRef.current.add(productId);
          lastUpdateRef.current = now;

          // Clear existing debounce timer
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }

          // Set new debounce timer
          debounceTimerRef.current = setTimeout(() => {
            processPendingUpdates();
          }, DEBOUNCE_MS);
        }
      )
      .subscribe((status) => {
        console.log(`🔄 Global real-time subscription status:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Successfully subscribed to global price offers updates`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Global channel error, attempting to reconnect...`);
          // Attempt to reconnect after a delay
          setTimeout(() => {
            if (channelRef.current) {
              channelRef.current.unsubscribe();
              channelRef.current = null;
            }
          }, 5000);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log(`🔄 Cleaning up global real-time channel`);
      
      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Process any pending updates before cleanup
      if (pendingUpdatesRef.current.size > 0) {
        processPendingUpdates();
      }
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, userId, processPendingUpdates]);

  return channelRef.current;
};

// Legacy hook for backward compatibility - now uses global channel
export const useOptimizedRealTimePriceOffers = ({ 
  productId, 
  enabled, 
  userId 
}: {
  productId: string;
  enabled: boolean;
  userId?: string;
}) => {
  // Use global real-time instead of per-product channels
  return useGlobalRealTimePriceOffers({ enabled: enabled && !!productId, userId });
};