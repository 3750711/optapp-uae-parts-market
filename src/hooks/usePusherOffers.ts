
import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePusherConnection } from './usePusherConnection';
import { PusherOfferEvent, PusherProductEvent } from '@/types/pusher';
import { useAuth } from '@/contexts/AuthContext';

export const usePusherOffers = (productId?: string) => {
  const { user } = useAuth();
  const { connectionState, subscribeTo, unsubscribeFrom } = usePusherConnection();
  const queryClient = useQueryClient();
  const [realtimeEvents, setRealtimeEvents] = useState<PusherOfferEvent[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  const invalidateOfferQueries = useCallback((productId: string) => {
    // Invalidate all related queries when offers change
    queryClient.invalidateQueries({ queryKey: ['user-offer', productId] });
    queryClient.invalidateQueries({ queryKey: ['competitive-offers', productId] });
    queryClient.invalidateQueries({ queryKey: ['buyer-auction-products'] });
    queryClient.invalidateQueries({ queryKey: ['product-offers', productId] });
  }, [queryClient]);

  const addRealtimeEvent = useCallback((event: PusherOfferEvent) => {
    setRealtimeEvents(prev => [event, ...prev.slice(0, 9)]); // Keep last 10 events
    setLastUpdateTime(new Date());
  }, []);

  useEffect(() => {
    if (!user || !connectionState.isConnected) return;

    const channels = [];
    
    // Subscribe to buyer's personal channel
    const buyerChannel = subscribeTo(`buyer-${user.id}`);
    if (buyerChannel) {
      channels.push(`buyer-${user.id}`);
      
      buyerChannel.bind('offer-created', (data: PusherOfferEvent) => {
        console.log('📢 Pusher: Offer created for buyer:', data);
        addRealtimeEvent(data);
        invalidateOfferQueries(data.product_id);
      });

      buyerChannel.bind('offer-updated', (data: PusherOfferEvent) => {
        console.log('📢 Pusher: Offer updated for buyer:', data);
        addRealtimeEvent(data);
        invalidateOfferQueries(data.product_id);
      });

      buyerChannel.bind('offer-status-changed', (data: PusherOfferEvent) => {
        console.log('📢 Pusher: Offer status changed for buyer:', data);
        addRealtimeEvent(data);
        invalidateOfferQueries(data.product_id);
      });
    }

    // Subscribe to product-specific channel if productId is provided
    if (productId) {
      const productChannel = subscribeTo(`product-${productId}`);
      if (productChannel) {
        channels.push(`product-${productId}`);
        
        productChannel.bind('offer-created', (data: PusherOfferEvent) => {
          console.log('📢 Pusher: New offer on product:', data);
          addRealtimeEvent(data);
          invalidateOfferQueries(productId);
        });

        productChannel.bind('offer-updated', (data: PusherOfferEvent) => {
          console.log('📢 Pusher: Offer updated on product:', data);
          addRealtimeEvent(data);
          invalidateOfferQueries(productId);
        });

        productChannel.bind('product-updated', (data: PusherProductEvent) => {
          console.log('📢 Pusher: Product updated:', data);
          setLastUpdateTime(new Date());
          invalidateOfferQueries(productId);
        });
      }
    }

    // Cleanup function
    return () => {
      channels.forEach(channel => {
        unsubscribeFrom(channel);
      });
    };
  }, [user, connectionState.isConnected, productId, subscribeTo, unsubscribeFrom, invalidateOfferQueries, addRealtimeEvent]);

  return {
    connectionState,
    realtimeEvents,
    lastUpdateTime,
    isConnected: connectionState.isConnected,
  };
};
