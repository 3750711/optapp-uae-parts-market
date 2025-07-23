import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Pusher from 'pusher-js';
import { useAuth } from '@/contexts/AuthContext';
import { PusherOfferEvent } from '@/types/pusher';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_KEYS, CACHE_FILTERS, createCacheKey } from '@/utils/cacheKeys';
import { getPusherCacheOptimizer } from '@/utils/pusherCacheOptimizer';

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

export const useOptimizedPusherRealtime = (config: PusherRealtimeConfig = {}) => {
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
  
  // Get cache optimizer instance
  const cacheOptimizer = getPusherCacheOptimizer(queryClient);

  // Enhanced update React Query data with cache optimization
  const updateQueryData = useCallback(async (event: PusherOfferEvent) => {
    if (!user?.id) return;

    console.log('📥 Processing real-time event:', {
      action: event.action,
      productId: event.product_id,
      buyerId: event.buyer_id,
      price: event.offered_price
    });
    
    // Optimistic update for immediate UI feedback
    if (event.buyer_id === user.id) {
      cacheOptimizer.optimisticUpdate(event.product_id, {
        userOfferPrice: event.offered_price,
        isUserLeading: false, // Will be updated with real data
      });
    }
    
    // Queue for batch processing
    cacheOptimizer.queueUpdate(event.product_id, event);
    
    // Update timestamp for UI reactivity
    setLastUpdateTime(new Date());
    
  }, [user?.id, cacheOptimizer]);

  // Handle incoming Pusher events
  const handlePusherEvent = useCallback((data: any, action: 'created' | 'updated' | 'deleted') => {
    const event: PusherOfferEvent = { ...data, action };
    
    console.log('🔔 Pusher event received:', event);
    
    // Add to events list (keep last 10)
    setRealtimeEvents(prev => [event, ...prev.slice(0, 9)]);
    
    // Update query data
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
        
        subscribedChannels.current.add(productChannelName);
        console.log('✅ Subscribed to product channel:', productChannelName);
      }
    }
  }, [connectionState.isConnected, user, productId, handlePusherEvent]);

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

    // Clear cache optimizer
    cacheOptimizer.clearPendingUpdates();
  }, [cacheOptimizer]);

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
    cacheOptimizer,
  };
};
