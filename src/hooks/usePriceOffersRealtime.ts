
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PriceOffer } from '@/types/price-offer';
import { devLog, prodError } from '@/utils/logger';

export const usePriceOffersRealtime = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const mountedRef = useRef(true);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    mountedRef.current = true;
    devLog('Setting up optimized real-time subscription for price offers');

    const channel = supabase
      .channel('price_offers_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'price_offers',
        },
        (payload) => {
          if (!mountedRef.current) return;
          
          devLog('Real-time price offer update:', payload.eventType);
          
          try {
            const updatedOffer = payload.new as PriceOffer;
            const productId = updatedOffer.product_id;
            
            // More targeted invalidation with exact keys
            queryClient.invalidateQueries({ queryKey: ['user-offer', productId], exact: true });
            queryClient.invalidateQueries({ queryKey: ['competitive-offers', productId], exact: true });
            queryClient.invalidateQueries({ queryKey: ['product-offers', productId], exact: true });
            
            // User-specific invalidations
            if (updatedOffer.buyer_id === user.id) {
              queryClient.invalidateQueries({ queryKey: ['buyer-price-offers', user.id], exact: true });
            }
            if (updatedOffer.seller_id === user.id) {
              queryClient.invalidateQueries({ queryKey: ['seller-price-offers', user.id], exact: true });
            }
          } catch (error) {
            prodError(error instanceof Error ? error : new Error(String(error)), {
              context: 'realtime-update-handler',
              userId: user.id
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'price_offers',
        },
        (payload) => {
          if (!mountedRef.current) return;
          
          devLog('Real-time price offer created:', payload.eventType);
          
          try {
            const newOffer = payload.new as PriceOffer;
            
            // Targeted invalidation for new offers
            queryClient.invalidateQueries({ queryKey: ['competitive-offers', newOffer.product_id], exact: true });
            queryClient.invalidateQueries({ queryKey: ['product-offers', newOffer.product_id], exact: true });
            
            // User-specific invalidations
            if (newOffer.seller_id === user.id) {
              queryClient.invalidateQueries({ queryKey: ['seller-price-offers', user.id], exact: true });
            }
          } catch (error) {
            prodError(error instanceof Error ? error : new Error(String(error)), {
              context: 'realtime-insert-handler',
              userId: user.id
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      mountedRef.current = false;
      devLog('Cleaning up real-time subscription for price offers');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, queryClient]);
};
