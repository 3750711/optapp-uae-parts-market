
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
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);

  const invalidateOfferQueries = useCallback((productId: string) => {
    console.log('🔄 Invalidating offer queries for product:', productId);
    
    // Force invalidate all related queries with aggressive refetch
    queryClient.invalidateQueries({ 
      queryKey: ['user-offer', productId],
      refetchType: 'all'
    });
    queryClient.invalidateQueries({ 
      queryKey: ['competitive-offers', productId],
      refetchType: 'all'
    });
    queryClient.invalidateQueries({ 
      queryKey: ['buyer-auction-products'],
      refetchType: 'all'
    });
    queryClient.invalidateQueries({ 
      queryKey: ['product-offers', productId],
      refetchType: 'all'
    });
    queryClient.invalidateQueries({ 
      queryKey: ['buyer-offer-counts'],
      refetchType: 'all'
    });
    queryClient.invalidateQueries({ 
      queryKey: ['batch-offers'],
      refetchType: 'all'
    });
    
    // Force immediate refetch with no cache
    queryClient.refetchQueries({ 
      queryKey: ['buyer-auction-products'],
      type: 'all'
    });
    queryClient.refetchQueries({ 
      queryKey: ['buyer-offer-counts'],
      type: 'all'
    });
    queryClient.refetchQueries({ 
      queryKey: ['batch-offers'],
      type: 'all'
    });
    
    // Trigger force update counter
    setForceUpdateCounter(prev => prev + 1);
    
    console.log('✅ Queries invalidated and refetched with force update counter:', forceUpdateCounter + 1);
  }, [queryClient, forceUpdateCounter]);

  const addRealtimeEvent = useCallback((event: PusherOfferEvent) => {
    console.log('📥 Adding realtime event:', event);
    const timestamp = new Date();
    setRealtimeEvents(prev => [event, ...prev.slice(0, 9)]); // Keep last 10 events
    setLastUpdateTime(timestamp);
    
    // Immediate invalidation after adding event
    setTimeout(() => {
      invalidateOfferQueries(event.product_id);
    }, 100);
  }, [invalidateOfferQueries]);

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
        addRealtimeEvent({ ...data, action: 'created' });
      });

      buyerChannel.bind('offer-updated', (data: PusherOfferEvent) => {
        console.log('📢 Pusher: Offer updated for buyer:', data);
        addRealtimeEvent({ ...data, action: 'updated' });
      });

      buyerChannel.bind('offer-status-changed', (data: PusherOfferEvent) => {
        console.log('📢 Pusher: Offer status changed for buyer:', data);
        addRealtimeEvent({ ...data, action: 'updated' });
      });

      buyerChannel.bind('offer-deleted', (data: PusherOfferEvent) => {
        console.log('📢 Pusher: Offer deleted for buyer:', data);
        addRealtimeEvent({ ...data, action: 'deleted' });
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
          addRealtimeEvent({ ...data, action: 'created' });
        });

        productChannel.bind('offer-updated', (data: PusherOfferEvent) => {
          console.log('📢 Pusher: Offer updated on product:', data);
          addRealtimeEvent({ ...data, action: 'updated' });
        });

        productChannel.bind('offer-deleted', (data: PusherOfferEvent) => {
          console.log('📢 Pusher: Offer deleted on product:', data);
          addRealtimeEvent({ ...data, action: 'deleted' });
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
  }, [user, connectionState.isConnected, productId, subscribeTo, unsubscribeFrom, addRealtimeEvent, invalidateOfferQueries]);

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
    forceUpdateCounter,
    isConnected: connectionState.isConnected,
  };
};
