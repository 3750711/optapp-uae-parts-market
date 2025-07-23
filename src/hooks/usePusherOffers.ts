
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

  // Simplified invalidation function without cyclic dependencies
  const invalidateOfferQueries = useCallback((productId: string) => {
    console.log('🔄 Invalidating queries for product:', productId);
    
    // Remove all cached data first
    queryClient.removeQueries({ queryKey: ['buyer-auction-products'] });
    queryClient.removeQueries({ queryKey: ['buyer-offer-counts'] });
    queryClient.removeQueries({ queryKey: ['batch-offers'] });
    queryClient.removeQueries({ queryKey: ['user-offer', productId] });
    queryClient.removeQueries({ queryKey: ['competitive-offers', productId] });
    queryClient.removeQueries({ queryKey: ['product-offers', productId] });
    
    // Force immediate refetch
    queryClient.invalidateQueries({ 
      queryKey: ['buyer-auction-products'],
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
    
    console.log('✅ Queries invalidated for product:', productId);
  }, [queryClient]);

  // Direct data update for instant UI changes
  const updateQueryData = useCallback((event: PusherOfferEvent) => {
    console.log('📊 Updating query data directly for event:', event);
    
    // Update buyer auction products cache
    queryClient.setQueryData(['buyer-auction-products', user?.id], (oldData: any) => {
      if (!oldData) return oldData;
      
      return oldData.map((product: any) => {
        if (product.id === event.product_id) {
          return {
            ...product,
            user_offer_price: event.offered_price,
            user_offer_status: event.status,
            user_offer_created_at: event.created_at,
            user_offer_updated_at: event.updated_at
          };
        }
        return product;
      });
    });
    
    console.log('✅ Query data updated for product:', event.product_id);
  }, [queryClient, user?.id]);

  const addRealtimeEvent = useCallback((event: PusherOfferEvent) => {
    console.log('📥 Processing realtime event:', event);
    const timestamp = new Date();
    
    // Add to events list
    setRealtimeEvents(prev => [event, ...prev.slice(0, 9)]);
    setLastUpdateTime(timestamp);
    
    // Update query data immediately for instant UI update
    updateQueryData(event);
    
    // Invalidate queries for fresh data
    invalidateOfferQueries(event.product_id);
    
    console.log('✅ Realtime event processed:', event.action, event.product_id);
  }, [updateQueryData, invalidateOfferQueries]);

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
  }, [user, connectionState.isConnected, productId, subscribeTo, unsubscribeFrom, addRealtimeEvent]);

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
