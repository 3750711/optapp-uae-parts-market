import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import { devLog, prodError } from '@/utils/logger';
import { detectWebSocketSupport, testWebSocketConnection, calculateBackoff, getFirefoxRecommendations, type WebSocketDiagnostics } from '@/utils/websocketUtils';

// ✅ ВКЛЮЧЕНИЕ WEBSOCKET ЧЕРЕЗ ПРОКСИ api.partsbay.ae
const REALTIME_DISABLED = false;

interface RealtimeContextType {
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed' | 'fallback';
  lastError?: string;
  realtimeEvents: any[];
  forceReconnect: () => void;
  diagnostics: WebSocketDiagnostics & { connectionTest?: WebSocketDiagnostics['connectionTest'] };
  isUsingFallback: boolean;
  reconnectAttempts: number;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

// Debounce utility for batch invalidations
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  // 🚫 ВРЕМЕННАЯ ЗАГЛУШКА ДЛЯ ОТКЛЮЧЕНИЯ WEBSOCKET
  if (REALTIME_DISABLED) {
    console.log('🚫 WebSocket/Realtime ОТКЛЮЧЕН для диагностики CORS проблем');
    
    const disabledContextValue: RealtimeContextType = {
      isConnected: false,
      connectionState: 'disconnected',
      lastError: 'WebSocket временно отключен для диагностики',
      realtimeEvents: [],
      forceReconnect: () => console.log('🚫 Reconnect отключен'),
      diagnostics: detectWebSocketSupport(),
      isUsingFallback: false,
      reconnectAttempts: 0,
    };

    return (
      <RealtimeContext.Provider value={disabledContextValue}>
        {children}
      </RealtimeContext.Provider>
    );
  }

  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'failed' | 'fallback'>('disconnected');
  const [lastError, setLastError] = useState<string>();
  const [realtimeEvents, setRealtimeEvents] = useState<any[]>([]);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [diagnostics, setDiagnostics] = useState<WebSocketDiagnostics & { connectionTest?: WebSocketDiagnostics['connectionTest'] }>(() => detectWebSocketSupport());
  
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const mountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const fallbackIntervalRef = useRef<NodeJS.Timeout>();
  const maxReconnectAttempts = 5;
  
  // Debounced invalidation functions
  const debouncedInvalidateOffers = useCallback(
    debounce((productId: string, userId?: string) => {
      if (!mountedRef.current) return;
      
      queryClient.invalidateQueries({ queryKey: ['user-offer', productId], exact: true });
      queryClient.invalidateQueries({ queryKey: ['competitive-offers', productId], exact: true });
      queryClient.invalidateQueries({ queryKey: ['product-offers', productId], exact: true });
      
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['buyer-price-offers', userId], exact: true });
        queryClient.invalidateQueries({ queryKey: ['seller-price-offers', userId], exact: true });
      }
    }, 300),
    [queryClient]
  );

  const debouncedInvalidateProducts = useCallback(
    debounce(() => {
      if (!mountedRef.current) return;
      queryClient.invalidateQueries({ queryKey: ['admin-products'], exact: true });
    }, 300),
    [queryClient]
  );

  const addRealtimeEvent = useCallback((event: any) => {
    setRealtimeEvents(prev => [
      { ...event, timestamp: new Date() },
      ...prev.slice(0, 19) // Keep last 20 events
    ]);
  }, []);

  // Handle price offers changes
  const handlePriceOfferChange = useCallback((payload: any) => {
    if (!mountedRef.current || !user) return;
    
    devLog('Price offer realtime event:', payload.eventType, payload);
    
    try {
      const offer = payload.new || payload.old;
      if (!offer) return;
      
      addRealtimeEvent({
        type: 'price_offer',
        action: payload.eventType,
        product_id: offer.product_id,
        offered_price: offer.offered_price
      });
      
      // Optimistic cache updates for specific operations
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        const updatedOffer = payload.new;
        
        // Update seller offers cache
        if (updatedOffer.seller_id === user.id) {
          queryClient.setQueryData(['seller-price-offers', user.id], (oldData: any) => {
            if (!oldData || !mountedRef.current) return oldData;
            
            if (payload.eventType === 'UPDATE') {
              return oldData.map((o: any) => 
                o.id === updatedOffer.id ? { ...o, ...updatedOffer } : o
              );
            } else {
              return [updatedOffer, ...oldData];
            }
          });
        }
      }
      
      // Debounced invalidation for related queries
      debouncedInvalidateOffers(offer.product_id, user.id);
      
    } catch (error) {
      prodError(error instanceof Error ? error : new Error(String(error)), {
        context: 'price-offer-realtime-handler',
        eventType: payload.eventType,
        userId: user.id
      });
    }
  }, [user, queryClient, debouncedInvalidateOffers, addRealtimeEvent]);

  // Handle products changes
  const handleProductChange = useCallback((payload: any) => {
    if (!mountedRef.current) return;
    
    devLog('Product realtime event:', payload.eventType, payload);
    
    try {
      const product = payload.new || payload.old;
      if (!product) return;
      
      addRealtimeEvent({
        type: 'product',
        action: payload.eventType,
        product_id: product.id,
        title: product.title
      });
      
      debouncedInvalidateProducts();
      
    } catch (error) {
      prodError(error instanceof Error ? error : new Error(String(error)), {
        context: 'product-realtime-handler',
        eventType: payload.eventType
      });
    }
  }, [debouncedInvalidateProducts, addRealtimeEvent]);

  // Test WebSocket connection
  const testConnection = useCallback(async () => {
    const { loadRuntimeConfig } = await import('@/config/runtime');
    const config = await loadRuntimeConfig();
    const wsUrl = `${config.SUPABASE_URL.replace(/^http/i, 'ws')}/realtime/v1/websocket?apikey=${encodeURIComponent(import.meta.env.VITE_SUPABASE_ANON_KEY!)}&vsn=1.0.0`;
    const result = await testWebSocketConnection(wsUrl);
    setDiagnostics(prev => ({ ...prev, connectionTest: result }));
    return result.success;
  }, []);

  // Start polling fallback when WebSocket fails
  const startPollingFallback = useCallback(() => {
    if (fallbackIntervalRef.current) return;
    
    console.log('🟡 Starting polling fallback due to WebSocket issues');
    setConnectionState('fallback');
    setIsUsingFallback(true);
    
    fallbackIntervalRef.current = setInterval(() => {
      if (!mountedRef.current || !user) return;
      
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['seller-price-offers', user.id] });
      queryClient.invalidateQueries({ queryKey: ['buyer-price-offers', user.id] });
      
      if (profile?.user_type === 'admin') {
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      }
    }, 10000); // Poll every 10 seconds
  }, [queryClient, user, profile]);

  // Stop polling fallback
  const stopPollingFallback = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = undefined;
    }
    setIsUsingFallback(false);
  }, []);

  // Setup channel with enhanced error handling
  const setupChannel = useCallback((
    channelName: string,
    tableName: string,
    handler: (payload: any) => void,
    filter?: string
  ) => {
    try {
      setConnectionState('connecting');
      
      const channel = supabase.channel(channelName);
      
      const config: any = {
        event: '*',
        schema: 'public',
        table: tableName,
      };
      
      if (filter) {
        config.filter = filter;
      }
      
      channel
        .on('postgres_changes', config, handler)
        .subscribe((status) => {
          devLog(`Channel ${channelName} status:`, status);
          
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setConnectionState('connected');
            setLastError(undefined);
            setReconnectAttempts(0);
            stopPollingFallback();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setIsConnected(false);
            setConnectionState('failed');
            
            const attempts = reconnectAttempts + 1;
            setReconnectAttempts(attempts);
            
            let errorMessage = `Connection failed: ${status}`;
            if (diagnostics.firefoxDetected) {
              errorMessage += '. Firefox detected - WebSocket issues may occur.';
            }
            setLastError(errorMessage);
            
            // Start fallback after multiple failures
            if (attempts >= 3 && !isUsingFallback) {
              startPollingFallback();
            }
            
            // Auto-retry with exponential backoff
            if (attempts < maxReconnectAttempts) {
              const delay = calculateBackoff(attempts - 1);
              console.log(`🔄 Retrying connection in ${delay}ms (attempt ${attempts}/${maxReconnectAttempts})`);
              
              setTimeout(() => {
                if (mountedRef.current) {
                  forceReconnect();
                }
              }, delay);
            }
          }
        });
      
      channelsRef.current.set(channelName, channel);
      return channel;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      prodError(new Error(errorMessage), {
        context: 'setup-realtime-channel',
        channelName,
        tableName,
        firefoxDetected: diagnostics.firefoxDetected
      });
      
      setConnectionState('failed');
      setLastError(errorMessage);
      
      // Fallback for setup errors
      if (!isUsingFallback) {
        startPollingFallback();
      }
    }
  }, [reconnectAttempts, diagnostics.firefoxDetected, isUsingFallback, startPollingFallback, stopPollingFallback, maxReconnectAttempts]);

  // Force reconnect function
  const forceReconnect = useCallback(async () => {
    devLog('Force reconnecting all realtime channels...');
    
    // Stop any fallback polling
    stopPollingFallback();
    
    // Reset attempts counter
    setReconnectAttempts(0);
    
    // Test connection first
    const canConnect = await testConnection();
    if (!canConnect && diagnostics.firefoxDetected) {
      console.warn('🔴 WebSocket test failed on Firefox. Recommendations:', getFirefoxRecommendations());
      setLastError('WebSocket connection blocked. Check Firefox settings.');
      startPollingFallback();
      return;
    }
    
    // Clear existing channels
    channelsRef.current.forEach((channel, name) => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        devLog('Error removing channel:', name, error);
      }
    });
    channelsRef.current.clear();
    
    setIsConnected(false);
    setConnectionState('connecting');
    
    // Reconnect after a short delay
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (user && mountedRef.current) {
        setupChannels();
      }
    }, 1000);
  }, [user, stopPollingFallback, testConnection, diagnostics.firefoxDetected, startPollingFallback]);

  // Setup all required channels
  const setupChannels = useCallback(() => {
    if (!user || !mountedRef.current) return;
    
    devLog('Setting up realtime channels for user:', user.id);
    
    try {
      // Price offers channel
      setupChannel(
        'unified-price-offers',
        'price_offers',
        handlePriceOfferChange
      );
      
      // Products channel (for admin users or sellers)
      if (profile?.user_type === 'admin' || profile?.user_type === 'seller') {
        setupChannel(
          'unified-products',
          'products',
          handleProductChange
        );
      }
      
    } catch (error) {
      prodError(error instanceof Error ? error : new Error(String(error)), {
        context: 'setup-realtime-channels',
        userId: user.id
      });
    }
  }, [user, profile, setupChannel, handlePriceOfferChange, handleProductChange]);

  // Main effect to manage realtime connections
  useEffect(() => {
    if (!user) {
      // Cleanup when user logs out
      channelsRef.current.forEach(channel => {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          devLog('Error removing channel on logout:', error);
        }
      });
      channelsRef.current.clear();
      setIsConnected(false);
      setConnectionState('disconnected');
      return;
    }

    mountedRef.current = true;
    setupChannels();

    return () => {
      mountedRef.current = false;
      
      // Cleanup channels
      channelsRef.current.forEach(channel => {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          devLog('Error removing channel on cleanup:', error);
        }
      });
      channelsRef.current.clear();
      
      // Clear timeouts and intervals
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
      }
    };
  }, [user, setupChannels]);

  // Initialize diagnostics on mount
  useEffect(() => {
    const initDiagnostics = async () => {
      const wsSupport = detectWebSocketSupport();
      setDiagnostics(wsSupport);
      
      if (wsSupport.firefoxDetected) {
        console.warn('🔴 Firefox detected. WebSocket connections may have issues.', getFirefoxRecommendations());
      }
    };
    
    initDiagnostics();
  }, []);

  const contextValue: RealtimeContextType = {
    isConnected,
    connectionState,
    lastError,
    realtimeEvents,
    forceReconnect,
    diagnostics,
    isUsingFallback,
    reconnectAttempts,
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
};