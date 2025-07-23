
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
    console.log('🔄 Invalidating offer queries for product:', productId);
    
    // Force invalidate all related queries
    queryClient.invalidateQueries({ queryKey: ['user-offer', productId] });
    queryClient.invalidateQueries({ queryKey: ['competitive-offers', productId] });
    queryClient.invalidateQueries({ queryKey: ['buyer-auction-products'] });
    queryClient.invalidateQueries({ queryKey: ['product-offers', productId] });
    queryClient.invalidateQueries({ queryKey: ['buyer-offer-counts'] });
    
    // Force refetch immediately
    queryClient.refetchQueries({ queryKey: ['buyer-auction-products'] });
    queryClient.refetchQueries({ queryKey: ['buyer-offer-counts'] });
    
    console.log('✅ Queries invalidated and refetched');
  }, [queryClient]);

  const addRealtimeEvent = useCallback((event: PusherOfferEvent) => {
    console.log('📥 Adding realtime event:', event);
    setRealtimeEvents(prev => [event, ...prev.slice(0, 9)]); // Keep last 10 events
    setLastUpdateTime(new Date());
  }, []);

  useEffect(() => {
    if (!user || !connectionState.isConnected) {
      console.log('⏳ Pusher: Waiting for connection...', {
        user: !!user,
        connected: connectionState.isConnected,
        state: connectionState.connectionState
      });
      return;
    }

    console.log('🚀 Pusher: Setting up subscriptions for user:', user.id);
    const channels = [];
    
    // Subscribe to buyer's personal channel
    const buyerChannelName = `buyer-${user.id}`;
    const buyerChannel = subscribeTo(buyerChannelName);
    if (buyerChannel) {
      channels.push(buyerChannelName);
      
      console.log('📢 Setting up buyer channel events for:', buyerChannelName);
      
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

      buyerChannel.bind('offer-deleted', (data: PusherOfferEvent) => {
        console.log('📢 Pusher: Offer deleted for buyer:', data);
        addRealtimeEvent(data);
        invalidateOfferQueries(data.product_id);
      });
    }

    // Subscribe to product-specific channel if productId is provided
    if (productId) {
      const productChannelName = `product-${productId}`;
      const productChannel = subscribeTo(productChannelName);
      if (productChannel) {
        channels.push(productChannelName);
        
        console.log('📢 Setting up product channel events for:', productChannelName);
        
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

        productChannel.bind('offer-deleted', (data: PusherOfferEvent) => {
          console.log('📢 Pusher: Offer deleted on product:', data);
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
      console.log('🧹 Pusher: Cleaning up subscriptions:', channels);
      channels.forEach(channel => {
        unsubscribeFrom(channel);
      });
    };
  }, [user, connectionState.isConnected, productId, subscribeTo, unsubscribeFrom, invalidateOfferQueries, addRealtimeEvent]);

  // Debug connection state changes
  useEffect(() => {
    console.log('📊 Pusher connection state changed:', {
      isConnected: connectionState.isConnected,
      state: connectionState.connectionState,
      error: connectionState.lastError,
      attempts: connectionState.reconnectAttempts
    });
  }, [connectionState]);

  return {
    connectionState,
    realtimeEvents,
    lastUpdateTime,
    isConnected: connectionState.isConnected,
  };
};
