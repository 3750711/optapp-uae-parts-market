import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Pusher from 'pusher-js';
import { useAuth } from '@/contexts/AuthContext';
import { PusherOfferEvent, PusherProductEvent } from '@/types/pusher';
import { supabase } from '@/integrations/supabase/client';

interface PusherRealtimeConfig {
  productId?: string;
  onEvent?: (event: PusherOfferEvent) => void;
}

interface ConnectionState {
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed';
  lastError?: string;
  reconnectAttempts: number;
}

export const usePusherRealtime = (config: PusherRealtimeConfig = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { productId, onEvent } = config;
  
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    connectionState: 'disconnected',
    reconnectAttempts: 0,
  });
  
  const [realtimeEvents, setRealtimeEvents] = useState<PusherOfferEvent[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  
  const pusherRef = useRef<Pusher | null>(null);
  const subscribedChannels = useRef<Set<string>>(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced update React Query data with proper competitive data recalculation
  const updateQueryData = useCallback(async (event: PusherOfferEvent) => {
    console.log('🔄 Processing real-time offer event:', {
      action: event.action,
      productId: event.product_id,
      buyerId: event.buyer_id,
      price: event.offered_price,
      status: event.status
    });
    
    // Update auction products data
    const statusFilters = ['all', 'active', 'cancelled', 'completed'];
    
    for (const statusFilter of statusFilters) {
      queryClient.setQueryData(['buyer-auction-products', user?.id, statusFilter], (oldData: any) => {
        if (!oldData) return oldData;
        
        console.log(`🔄 Updating auction products for filter: ${statusFilter}`);
        
        return oldData.map((product: any) => {
          if (product.id === event.product_id) {
            // Only update if this event is for the current user
            if (event.buyer_id === user?.id) {
              console.log('📦 Updating user offer data for product:', product.id);
              return {
                ...product,
                user_offer_price: event.offered_price,
                user_offer_status: event.status,
                user_offer_created_at: event.created_at,
                user_offer_updated_at: event.updated_at,
              };
            }
            // For other users' offers, we need to refresh competitive data
            console.log('🏆 Other user offer detected, will refresh competitive data');
            return product;
          }
          return product;
        });
      });
    }
    
    // Get fresh competitive data for the affected product
    try {
      const { data: freshCompetitiveData, error } = await supabase
        .rpc('get_competitive_offer_data', {
          p_product_id: event.product_id,
          p_user_id: user?.id
        });

      if (error) {
        console.error('❌ Error getting fresh competitive data:', error);
        return;
      }

      console.log('✅ Fresh competitive data received:', freshCompetitiveData);

      // Update all status filters with fresh competitive data
      for (const statusFilter of statusFilters) {
        queryClient.setQueryData(['buyer-auction-products', user?.id, statusFilter], (oldData: any) => {
          if (!oldData) return oldData;
          
          return oldData.map((product: any) => {
            if (product.id === event.product_id && freshCompetitiveData?.[0]) {
              const compData = freshCompetitiveData[0];
              console.log(`📊 Updating competitive data for product ${product.id}:`, {
                title: product.title,
                userPrice: compData.current_user_offer_price,
                maxOtherPrice: compData.max_offer_price,
                isUserLeading: compData.current_user_is_max,
                totalOffers: compData.total_offers_count
              });
              
              return {
                ...product,
                max_other_offer: compData.max_offer_price,
                is_user_leading: compData.current_user_is_max,
                offers_count: compData.total_offers_count,
                user_offer_price: compData.current_user_offer_price || product.user_offer_price
              };
            }
            return product;
          });
        });
      }
    } catch (error) {
      console.error('❌ Error updating competitive data:', error);
    }
    
    // Update offer counts
    queryClient.invalidateQueries({ 
      queryKey: ['buyer-offer-counts'],
      refetchType: 'active'
    });
    
    // Invalidate batch offers
    queryClient.invalidateQueries({
      queryKey: ['batch-offers'],
      refetchType: 'active'
    });
    
    console.log('✅ Real-time data update completed');
  }, [queryClient, user?.id]);

  // Handle incoming Pusher events
  const handlePusherEvent = useCallback((data: any, action: 'created' | 'updated' | 'deleted') => {
    const event: PusherOfferEvent = { ...data, action };
    console.log('📥 Pusher event received:', {
      action,
      productId: event.product_id,
      buyerId: event.buyer_id,
      price: event.offered_price,
      status: event.status
    });
    
    // Add to events list (keep last 10)
    setRealtimeEvents(prev => [event, ...prev.slice(0, 9)]);
    
    // Update timestamp for UI reactivity
    const now = new Date();
    setLastUpdateTime(now);
    console.log('⏰ Update time set to:', now.toISOString());
    
    // Update query data with competitive data recalculation
    updateQueryData(event);
    
    // Call custom event handler if provided
    if (onEvent) {
      onEvent(event);
    }
  }, [updateQueryData, onEvent]);

  // Connect to Pusher
  const connect = useCallback(() => {
    if (!user || pusherRef.current) return;

    console.log('🔗 Connecting to Pusher for user:', user.id);
    
    const pusher = new Pusher('ea75c08dc00d482910a3', {
      cluster: 'ap2',
      forceTLS: true,
      enabledTransports: ['ws', 'wss'],
    });

    // Connection event handlers
    pusher.connection.bind('connecting', () => {
      console.log('🔄 Pusher connecting...');
      setConnectionState(prev => ({ ...prev, connectionState: 'connecting' }));
    });

    pusher.connection.bind('connected', () => {
      console.log('✅ Pusher connected successfully');
      setConnectionState(prev => ({ 
        ...prev, 
        isConnected: true,
        connectionState: 'connected',
        reconnectAttempts: 0,
        lastError: undefined
      }));
    });

    pusher.connection.bind('disconnected', () => {
      console.log('❌ Pusher disconnected');
      setConnectionState(prev => ({ 
        ...prev, 
        isConnected: false,
        connectionState: 'disconnected'
      }));
    });

    pusher.connection.bind('failed', () => {
      console.log('💥 Pusher connection failed');
      setConnectionState(prev => ({ 
        ...prev, 
        isConnected: false,
        connectionState: 'failed',
        lastError: 'Connection failed'
      }));
    });

    pusher.connection.bind('error', (err: any) => {
      console.error('🚨 Pusher error:', err);
      setConnectionState(prev => ({ 
        ...prev, 
        lastError: err.message || 'Connection error'
      }));
    });

    pusherRef.current = pusher;
  }, [user]);

  // Subscribe to channels
  const subscribeToChannels = useCallback(() => {
    if (!pusherRef.current || !user || !connectionState.isConnected) return;

    console.log('📺 Subscribing to channels for user:', user.id);
    
    // Subscribe to buyer's personal channel
    const buyerChannelName = `buyer-${user.id}`;
    if (!subscribedChannels.current.has(buyerChannelName)) {
      const buyerChannel = pusherRef.current.subscribe(buyerChannelName);
      
      buyerChannel.bind('offer-created', (data: PusherOfferEvent) => {
        console.log('🆕 Offer created event:', data);
        handlePusherEvent(data, 'created');
      });
      
      buyerChannel.bind('offer-updated', (data: PusherOfferEvent) => {
        console.log('🔄 Offer updated event:', data);
        handlePusherEvent(data, 'updated');
      });
      
      buyerChannel.bind('offer-status-changed', (data: PusherOfferEvent) => {
        console.log('📊 Offer status changed event:', data);
        handlePusherEvent(data, 'updated');
      });
      
      buyerChannel.bind('offer-deleted', (data: PusherOfferEvent) => {
        console.log('🗑️ Offer deleted event:', data);
        handlePusherEvent(data, 'deleted');
      });
      
      subscribedChannels.current.add(buyerChannelName);
      console.log('✅ Subscribed to buyer channel:', buyerChannelName);
    }

    // Subscribe to product-specific channel if productId is provided
    if (productId) {
      const productChannelName = `product-${productId}`;
      if (!subscribedChannels.current.has(productChannelName)) {
        const productChannel = pusherRef.current.subscribe(productChannelName);
        
        productChannel.bind('offer-created', (data: PusherOfferEvent) => {
          console.log('🆕 Product offer created:', data);
          handlePusherEvent(data, 'created');
        });
        
        productChannel.bind('offer-updated', (data: PusherOfferEvent) => {
          console.log('🔄 Product offer updated:', data);
          handlePusherEvent(data, 'updated');
        });
        
        productChannel.bind('offer-deleted', (data: PusherOfferEvent) => {
          console.log('🗑️ Product offer deleted:', data);
          handlePusherEvent(data, 'deleted');
        });
        
        productChannel.bind('product-updated', (data: PusherProductEvent) => {
          console.log('📢 Product updated:', data);
          setLastUpdateTime(new Date());
          queryClient.invalidateQueries({ 
            queryKey: ['product-offers', productId],
            refetchType: 'active'
          });
        });
        
        subscribedChannels.current.add(productChannelName);
        console.log('✅ Subscribed to product channel:', productChannelName);
      }
    }
  }, [connectionState.isConnected, user, productId, handlePusherEvent, queryClient]);

  // Disconnect and cleanup
  const disconnect = useCallback(() => {
    if (pusherRef.current) {
      console.log('🔌 Disconnecting from Pusher...');
      subscribedChannels.current.forEach(channel => {
        pusherRef.current?.unsubscribe(channel);
      });
      subscribedChannels.current.clear();
      pusherRef.current.disconnect();
      pusherRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Force reconnect
  const forceReconnect = useCallback(() => {
    console.log('🔄 Force reconnecting...');
    disconnect();
    setConnectionState(prev => ({ 
      ...prev, 
      reconnectAttempts: prev.reconnectAttempts + 1
    }));
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, 1000);
  }, [disconnect, connect]);

  // Initialize connection
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  // Subscribe to channels when connected
  useEffect(() => {
    subscribeToChannels();
  }, [subscribeToChannels]);

  return {
    connectionState,
    realtimeEvents,
    lastUpdateTime,
    isConnected: connectionState.isConnected,
    forceReconnect,
  };
};
