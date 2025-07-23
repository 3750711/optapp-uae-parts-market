import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Pusher from 'pusher-js';
import { useAuth } from '@/contexts/AuthContext';
import { PusherOfferEvent, PusherProductEvent } from '@/types/pusher';

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

  // Enhanced update React Query data with proper competitive data calculation
  const updateQueryData = useCallback((event: PusherOfferEvent) => {
    console.log('🔄 Updating query data for event:', event.action, event.product_id);
    
    // Update all status filters (all, active, cancelled, completed)
    const statusFilters = ['all', 'active', 'cancelled', 'completed'];
    
    statusFilters.forEach(statusFilter => {
      queryClient.setQueryData(['buyer-auction-products', user?.id, statusFilter], (oldData: any) => {
        if (!oldData) return oldData;
        
        return oldData.map((product: any) => {
          if (product.id === event.product_id) {
            console.log('📦 Updating product:', product.id, 'with new offer data');
            
            // Update the product with new offer data
            const updatedProduct = {
              ...product,
              user_offer_price: event.offered_price,
              user_offer_status: event.status,
              user_offer_created_at: event.created_at,
              user_offer_updated_at: event.updated_at,
              // Keep existing competitive data for now, will be recalculated
              max_other_offer: product.max_other_offer || 0,
              is_user_leading: product.is_user_leading || false,
            };
            
            console.log('✅ Product updated:', updatedProduct);
            return updatedProduct;
          }
          return product;
        });
      });
    });
    
    // Update offer counts
    queryClient.invalidateQueries({ 
      queryKey: ['buyer-offer-counts'],
      refetchType: 'active'
    });
    
    // Invalidate batch offers to get fresh competitive data
    queryClient.invalidateQueries({
      queryKey: ['batch-offers'],
      refetchType: 'active'
    });
    
    console.log('✅ Query data updated for all filters');
  }, [queryClient, user?.id]);

  // Handle incoming Pusher events
  const handlePusherEvent = useCallback((data: any, action: 'created' | 'updated' | 'deleted') => {
    const event: PusherOfferEvent = { ...data, action };
    console.log('📥 Pusher event received:', action, event.product_id, 'offered_price:', event.offered_price);
    
    // Add to events list (keep last 10)
    setRealtimeEvents(prev => [event, ...prev.slice(0, 9)]);
    
    // Update timestamp for UI reactivity
    const now = new Date();
    setLastUpdateTime(now);
    console.log('⏰ Update time set to:', now.toISOString());
    
    // Update query data immediately
    updateQueryData(event);
    
    // Call custom event handler if provided
    if (onEvent) {
      onEvent(event);
    }
  }, [updateQueryData, onEvent]);

  // Connect to Pusher
  const connect = useCallback(() => {
    if (!user || pusherRef.current) return;

    console.log('🔗 Connecting to Pusher...');
    
    const pusher = new Pusher('ea75c08dc00d482910a3', {
      cluster: 'ap2',
      forceTLS: true,
      enabledTransports: ['ws', 'wss'],
    });

    // Connection event handlers
    pusher.connection.bind('connecting', () => {
      setConnectionState(prev => ({ ...prev, connectionState: 'connecting' }));
    });

    pusher.connection.bind('connected', () => {
      console.log('✅ Pusher connected');
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

    console.log('📺 Subscribing to channels...');
    
    // Subscribe to buyer's personal channel
    const buyerChannelName = `buyer-${user.id}`;
    if (!subscribedChannels.current.has(buyerChannelName)) {
      const buyerChannel = pusherRef.current.subscribe(buyerChannelName);
      
      buyerChannel.bind('offer-created', (data: PusherOfferEvent) => {
        handlePusherEvent(data, 'created');
      });
      
      buyerChannel.bind('offer-updated', (data: PusherOfferEvent) => {
        handlePusherEvent(data, 'updated');
      });
      
      buyerChannel.bind('offer-status-changed', (data: PusherOfferEvent) => {
        handlePusherEvent(data, 'updated');
      });
      
      buyerChannel.bind('offer-deleted', (data: PusherOfferEvent) => {
        handlePusherEvent(data, 'deleted');
      });
      
      subscribedChannels.current.add(buyerChannelName);
      console.log('✅ Subscribed to buyer channel');
    }

    // Subscribe to product-specific channel if productId is provided
    if (productId) {
      const productChannelName = `product-${productId}`;
      if (!subscribedChannels.current.has(productChannelName)) {
        const productChannel = pusherRef.current.subscribe(productChannelName);
        
        productChannel.bind('offer-created', (data: PusherOfferEvent) => {
          handlePusherEvent(data, 'created');
        });
        
        productChannel.bind('offer-updated', (data: PusherOfferEvent) => {
          handlePusherEvent(data, 'updated');
        });
        
        productChannel.bind('offer-deleted', (data: PusherOfferEvent) => {
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
        console.log('✅ Subscribed to product channel');
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
