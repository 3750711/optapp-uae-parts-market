import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import { devLog, prodError } from '@/utils/logger';
import { detectWebSocketSupport, testWebSocketConnection, calculateBackoff, getFirefoxRecommendations, type WebSocketDiagnostics } from '@/utils/websocketUtils';
import { Notification } from '@/types/notification';
import { authSessionManager } from '@/utils/authSessionManager';
import { createCircuitBreaker, safeSetRealtimeAuth, isRealtimeDisabled, type RtMode } from '@/utils/realtimeGuard';
import { getRecommendedRealtimeMode, logNetworkProfile, isLikelyCellularSlow } from '@/utils/netProfile';

interface RealtimeContextType {
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed' | 'fallback';
  lastError?: string;
  realtimeEvents: any[];
  forceReconnect: () => void;
  diagnostics: WebSocketDiagnostics & { connectionTest?: WebSocketDiagnostics['connectionTest'] };
  isUsingFallback: boolean;
  reconnectAttempts: number;
  realtimeMode: 'on' | 'degraded' | 'off';
  // Notifications state and methods
  notifications: Notification[];
  unreadCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
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
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'failed' | 'fallback'>('disconnected');
  const [lastError, setLastError] = useState<string>();
  const [realtimeEvents, setRealtimeEvents] = useState<any[]>([]);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [diagnostics, setDiagnostics] = useState<WebSocketDiagnostics & { connectionTest?: WebSocketDiagnostics['connectionTest'] }>(() => detectWebSocketSupport());
  
  // Realtime protection and mode management with cellular detection
  const [realtimeMode, setRealtimeMode] = useState<'on' | 'degraded' | 'off'>(() => {
    if (isRealtimeDisabled()) return 'off';
    
    // Start with 'off' mode on cellular networks to avoid CORS issues
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection && (connection.type === 'cellular' || ['slow-2g', '2g', '3g'].includes(connection.effectiveType))) {
      console.log('🔧 [RT] Cellular network detected, starting with realtime OFF');
      return 'off';
    }
    
    return getRecommendedRealtimeMode();
  });
  const circuitBreakerRef = useRef(createCircuitBreaker());
  const [realtimeReady, setRealtimeReady] = useState(false);
  
  // Notifications state  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Channel counting for dev mode
  const [activeChannelsCount, setActiveChannelsCount] = useState(0);
  
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const mountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const fallbackIntervalRef = useRef<NodeJS.Timeout>();
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const maxReconnectAttempts = 5;
  
  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user || !mountedRef.current) return;
    
    const controller = new AbortController();
    
    try {
      console.log('🔍 [RealtimeProvider] Fetching notifications for user:', user.id);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, type, title, message, title_en, message_en, language, data, read, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)
        .abortSignal(controller.signal);

      if (error) throw error;

      console.log('✅ [RealtimeProvider] Notifications fetched:', data?.length || 0);
      
      if (mountedRef.current) {
        setNotifications(data || []);
        setUnreadCount((data || []).filter(n => !n.read).length);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError' && mountedRef.current) {
        console.error('❌ [RealtimeProvider] Error fetching notifications:', error);
      }
    }
  }, [user]);

  // Start polling mode for degraded/off states
  const startPollingMode = useCallback(() => {
    if (pollingIntervalRef.current) return;
    
    console.log('🟡 Starting polling mode (Realtime mode:', realtimeMode, ')');
    setConnectionState('fallback');
    setIsUsingFallback(true);
    
    pollingIntervalRef.current = setInterval(() => {
      if (!mountedRef.current || !user) return;
      
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['seller-price-offers', user.id] });
      queryClient.invalidateQueries({ queryKey: ['buyer-price-offers', user.id] });
      
      if (profile?.user_type === 'admin') {
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['message-history'] });
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        queryClient.invalidateQueries({ queryKey: ['telegram-notifications'] });
      }
      
      if (profile?.user_type === 'seller' || profile?.user_type === 'buyer') {
        queryClient.invalidateQueries({ queryKey: ['user-orders'] });
        queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      }
      
      // Also refresh notifications during polling
      fetchNotifications();
    }, realtimeMode === 'off' ? 15000 : 10000); // Longer intervals for off mode
  }, [queryClient, user, profile, fetchNotifications, realtimeMode]);

  // Legacy fallback method for compatibility
  const startPollingFallback = startPollingMode;

  // Stop polling mode
  const stopPollingMode = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = undefined;
    }
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = undefined;
    }
    setIsUsingFallback(false);
  }, []);

  // Legacy method for compatibility
  const stopPollingFallback = stopPollingMode;

  // Initialize realtime mode and readiness
  useEffect(() => {
    let isSubscribed = true;

    // Log network profile for debugging
    if (localStorage.getItem('DEBUG_RT') === '1') {
      logNetworkProfile();
    }

    // If realtime is disabled, start polling immediately and exit
    if (realtimeMode === 'off') {
      console.log('🔧 [RT] Realtime disabled, starting polling mode');
      startPollingMode();
      return;
    }

    // Check if we already have a valid session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isSubscribed) return;
      
      console.debug('[RT] Current session check:', {
        userId: session?.user?.id,
        hasToken: Boolean(session?.access_token),
        mode: realtimeMode
      });
      
      if (session?.access_token) {
        console.log('🔧 [RT] Token ready immediately, setting realtime ready');
        
        // Safe auth update with debouncing
        const authUpdated = safeSetRealtimeAuth(supabase, session.access_token);
        if (authUpdated) {
          setRealtimeReady(true);
        }
      }
    });

    // Listen for readiness signals from AuthSessionManager  
    const onReady = () => {
      if (!isSubscribed) return;
      if (realtimeMode as string === 'off') return;
      
      console.log('🔧 [RT] Received realtime ready signal from AuthSessionManager');
      
      // Get current session and update auth safely
      supabase.auth.getSession().then(({ data: { session } }) => {
        const authUpdated = safeSetRealtimeAuth(supabase, session?.access_token);
        if (authUpdated) {
          setRealtimeReady(true);
        }
      });
    };

    authSessionManager.onRealtimeReady(onReady);

    return () => {
      isSubscribed = false;
      authSessionManager.offRealtimeReady(onReady);
    };
  }, [realtimeMode, startPollingMode]);
  const logChannelEvent = useCallback((event: 'subscribe' | 'unsubscribe', channelName: string) => {
    if (process.env.NODE_ENV === 'development') {
      const count = channelsRef.current.size;
      console.log(`📡 [RealtimeProvider] ${event.toUpperCase()}: ${channelName} (Active channels: ${count})`);
      setActiveChannelsCount(count);
    }
  }, []);

  // Channel diagnostics for dev mode
  const attachChannelDiagnostics = useCallback((channel: any, channelName: string) => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const warnOnce = (() => {
      let fired = false;
      return (msg: string, ...args: any[]) => {
        if (!fired) {
          console.warn(msg, ...args);
          fired = true;
        }
      };
    })();

    // Enhanced status tracking with session diagnostics
    channel.subscribe(async (status: string, err?: any) => {
      // DEV ONLY — подписываемся на статусы для каждого канала
      if (import.meta.env.DEV) {
        console.debug('[RT][DEV]', channelName, 'status:', status, err ?? '');
      }
      
        if (status === 'SUBSCRIBED') {
        console.debug(`[RT] ${channelName}: ${status}`);
        // Note success for circuit breaker
        circuitBreakerRef.current.noteSuccess();
        if (realtimeMode !== 'on') {
          console.log('🟢 [RT] Channel subscribed, upgrading to ON mode');
          setRealtimeMode('on');
          stopPollingMode(); // Stop polling when RT works
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        // Log session state on channel errors for debugging
        const { data: { session } } = await supabase.auth.getSession();
        console.error(`[RT] Channel issue (${channelName}): ${status}`, {
          error: err,
          hasSession: Boolean(session),
          hasToken: Boolean(session?.access_token),
          mode: realtimeMode
        });
        warnOnce(`[Realtime] Channel issue (${channelName}): ${status}`, err || '');
        
        // Handle channel errors with circuit breaker
        handleRealtimeError(err || new Error(status), `Channel ${channelName}`);
      }
    });
  }, []);

  // (fetchNotifications moved above)

  // Test WebSocket connection
  const testConnection = useCallback(async () => {
    // First check HTTP availability
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://vfiylfljiixqkjfqubyq.supabase.co/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        setDiagnostics(prev => ({ ...prev, connectionTest: { success: false, error: 'Supabase API not accessible' } }));
        return false;
      }
    } catch (error) {
      setDiagnostics(prev => ({ ...prev, connectionTest: { success: false, error: 'Network error: ' + (error as Error).message } }));
      return false;
    }

    // Then test WebSocket (fixed URL without vsn parameter)
    const wsUrl = `wss://vfiylfljiixqkjfqubyq.supabase.co/realtime/v1/websocket?apikey=${encodeURIComponent("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0")}`;
    const result = await testWebSocketConnection(wsUrl);
    setDiagnostics(prev => ({ ...prev, connectionTest: result }));
    return result.success;
  }, []);

  // Dev mode logging utility

  // Force reconnect function with circuit breaker protection
  const forceReconnect = useCallback(async () => {
    devLog('Force reconnecting all realtime channels...');
    
    // Check circuit breaker state
    if (circuitBreakerRef.current.mode === 'off') {
      console.log('🔴 [RT] Circuit breaker is OFF, cannot reconnect');
      if (!isUsingFallback) {
        startPollingMode();
      }
      return;
    }
    
    // Stop any polling
    stopPollingMode();
    
    // Reset attempts counter
    setReconnectAttempts(0);
    
    // Test connection first (only if not in degraded cellular mode)
    if (!isLikelyCellularSlow()) {
      const canConnect = await testConnection();
      if (!canConnect) {
        const breakerState = circuitBreakerRef.current.noteFailure();
        
        if (diagnostics.firefoxDetected) {
          console.warn('🔴 WebSocket test failed on Firefox. Recommendations:', getFirefoxRecommendations());
          setLastError('WebSocket connection blocked. Using polling fallback for Firefox.');
        } else {
          setLastError('WebSocket connection failed. Using polling fallback.');
        }
        
        setRealtimeMode(breakerState.mode);
        startPollingMode();
        return;
      }
    }
    
    // Clear existing channels
    channelsRef.current.forEach((channel, name) => {
      try {
        logChannelEvent('unsubscribe', name);
        channel.unsubscribe();
      } catch (error) {
        console.error(`🔴 [RealtimeProvider] Error unsubscribing channel ${name}:`, error);
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
      if (user && mountedRef.current && realtimeMode !== 'off') {
        setupChannels();
      }
    }, 1000);
  }, [user, stopPollingMode, testConnection, diagnostics.firefoxDetected, startPollingMode, logChannelEvent, isUsingFallback, realtimeMode]);

  // Unified error handler with circuit breaker
  const handleRealtimeError = useCallback((error: any, context: string) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`🔴 [RealtimeProvider] ${context}:`, errorMessage);
    
    setLastError(`${context}: ${errorMessage}`);
    
    // Update circuit breaker
    const breakerState = circuitBreakerRef.current.noteFailure();
    setRealtimeMode(breakerState.mode);
    
    // Handle based on circuit breaker state
    if (breakerState.mode === 'off') {
      console.warn('🔴 Circuit breaker tripped, switching to polling mode');
      startPollingMode();
      return;
    }
    
    // Increment reconnect attempts and trigger reconnect if not at max
    setReconnectAttempts(prev => {
      const newAttempts = prev + 1;
      if (newAttempts < maxReconnectAttempts && breakerState.mode !== 'off') {
        const delay = calculateBackoff(newAttempts - 1);
        console.log(`🔄 Auto-reconnect in ${delay}ms (attempt ${newAttempts}/${maxReconnectAttempts})`);
        
        setTimeout(() => {
          if (mountedRef.current) {
            forceReconnect();
          }
        }, delay);
      } else {
        console.warn('🔴 Max reconnect attempts reached, falling back to polling');
        startPollingMode();
      }
      return newAttempts;
    });
  }, [maxReconnectAttempts, startPollingMode, forceReconnect]);
  
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

  const debouncedInvalidateOrders = useCallback(
    debounce(() => {
      if (!mountedRef.current) return;
      queryClient.invalidateQueries({ queryKey: ['admin-orders'], exact: true });
      queryClient.invalidateQueries({ queryKey: ['user-orders'], exact: true });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'], exact: true });
    }, 300),
    [queryClient]
  );

  const debouncedInvalidateMessageHistory = useCallback(
    debounce(() => {
      if (!mountedRef.current) return;
      queryClient.invalidateQueries({ queryKey: ['message-history'], exact: true });
      queryClient.invalidateQueries({ queryKey: ['new-message-history'], exact: true });
    }, 300),
    [queryClient]
  );

  const debouncedInvalidateProfiles = useCallback(
    debounce(() => {
      if (!mountedRef.current) return;
      queryClient.invalidateQueries({ queryKey: ['profile'], exact: true });
      queryClient.invalidateQueries({ queryKey: ['admin-users'], exact: true });
    }, 300),
    [queryClient]
  );

  const debouncedInvalidateTelegramLogs = useCallback(
    debounce(() => {
      if (!mountedRef.current) return;
      queryClient.invalidateQueries({ queryKey: ['telegram-notifications'], exact: true });
      queryClient.invalidateQueries({ queryKey: ['telegram-notification-stats'], exact: true });
    }, 300),
    [queryClient]
  );

  const debouncedRefreshNotifications = useCallback(
    debounce(() => {
      if (!mountedRef.current || !user) return;
      fetchNotifications();
    }, 300),
    [user, fetchNotifications]
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
      handleRealtimeError(error, 'price-offer-realtime-handler');
    }
  }, [user, queryClient, debouncedInvalidateOffers, addRealtimeEvent, handleRealtimeError]);

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
      handleRealtimeError(error, 'product-realtime-handler');
    }
  }, [debouncedInvalidateProducts, addRealtimeEvent, handleRealtimeError]);

  // Handle notifications changes
  const handleNotificationChange = useCallback((payload: any) => {
    if (!mountedRef.current || !user) return;
    
    devLog('Notification realtime event:', payload.eventType, payload);
    
    try {
      addRealtimeEvent({
        type: 'notification',
        action: payload.eventType,
        notification_id: payload.new?.id || payload.old?.id
      });
      
      // Refresh notifications data
      debouncedRefreshNotifications();
      
    } catch (error) {
      handleRealtimeError(error, 'notification-realtime-handler');
    }
  }, [user, addRealtimeEvent, debouncedRefreshNotifications, handleRealtimeError]);

  // Handle orders changes
  const handleOrderChange = useCallback((payload: any) => {
    if (!mountedRef.current) return;
    
    devLog('Order realtime event:', payload.eventType, payload);
    
    try {
      const order = payload.new || payload.old;
      if (!order) return;
      
      addRealtimeEvent({
        type: 'order',
        action: payload.eventType,
        order_id: order.id,
        order_number: order.order_number
      });
      
      debouncedInvalidateOrders();
      
    } catch (error) {
      handleRealtimeError(error, 'order-realtime-handler');
    }
  }, [debouncedInvalidateOrders, addRealtimeEvent, handleRealtimeError]);

  // Handle message_history changes
  const handleMessageHistoryChange = useCallback((payload: any) => {
    if (!mountedRef.current) return;
    
    devLog('Message history realtime event:', payload.eventType, payload);
    
    try {
      const message = payload.new || payload.old;
      if (!message) return;
      
      addRealtimeEvent({
        type: 'message_history',
        action: payload.eventType,
        message_id: message.id,
        status: message.status
      });
      
      debouncedInvalidateMessageHistory();
      
    } catch (error) {
      handleRealtimeError(error, 'message-history-realtime-handler');
    }
  }, [debouncedInvalidateMessageHistory, addRealtimeEvent, handleRealtimeError]);

  // Handle profiles changes
  const handleProfileChange = useCallback((payload: any) => {
    if (!mountedRef.current) return;
    
    devLog('Profile realtime event:', payload.eventType, payload);
    
    try {
      const profile = payload.new || payload.old;
      if (!profile) return;
      
      addRealtimeEvent({
        type: 'profile',
        action: payload.eventType,
        profile_id: profile.id,
        verification_status: profile.verification_status
      });
      
      debouncedInvalidateProfiles();
      
    } catch (error) {
      handleRealtimeError(error, 'profile-realtime-handler');
    }
  }, [debouncedInvalidateProfiles, addRealtimeEvent, handleRealtimeError]);

  // Handle telegram_notifications_log changes
  const handleTelegramLogChange = useCallback((payload: any) => {
    if (!mountedRef.current) return;
    
    devLog('Telegram log realtime event:', payload.eventType, payload);
    
    try {
      const log = payload.new || payload.old;
      if (!log) return;
      
      addRealtimeEvent({
        type: 'telegram_log',
        action: payload.eventType,
        log_id: log.id,
        status: log.status
      });
      
      debouncedInvalidateTelegramLogs();
      
    } catch (error) {
      handleRealtimeError(error, 'telegram-log-realtime-handler');
    }
  }, [debouncedInvalidateTelegramLogs, addRealtimeEvent, handleRealtimeError]);

  // Notification management functions
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    if (!user || !mountedRef.current) return;
    
    const controller = new AbortController();
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id)
        .abortSignal(controller.signal);

      if (error) throw error;

      // Update local state optimistically
      if (mountedRef.current) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      if (error.name !== 'AbortError' && mountedRef.current) {
        console.error('❌ [RealtimeProvider] Error marking notification as read:', error);
      }
    }
  }, [user]);

  const markAllNotificationsAsRead = useCallback(async () => {
    if (!user || !mountedRef.current) return;

    const controller = new AbortController();

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)
        .abortSignal(controller.signal);

      if (error) throw error;

      if (mountedRef.current) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError' && mountedRef.current) {
        console.error('❌ [RealtimeProvider] Error marking all notifications as read:', error);
      }
    }
  }, [user]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user || !mountedRef.current) return;
    
    const controller = new AbortController();
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id)
        .abortSignal(controller.signal);

      if (error) throw error;

      if (mountedRef.current) {
        setNotifications(prev => {
          const filtered = prev.filter(n => n.id !== notificationId);
          const newUnreadCount = filtered.filter(n => !n.read).length;
          setUnreadCount(newUnreadCount);
          return filtered;
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError' && mountedRef.current) {
        console.error('❌ [RealtimeProvider] Error deleting notification:', error);
      }
    }
  }, [user]);

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
            logChannelEvent('subscribe', channelName);
            setIsConnected(true);
            setConnectionState('connected');
            setLastError(undefined);
            setReconnectAttempts(0);
            stopPollingFallback();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            logChannelEvent('unsubscribe', channelName);
            setIsConnected(false);
            setConnectionState('failed');
            
            handleRealtimeError(
              new Error(`Channel ${channelName} failed: ${status}`),
              'Channel subscription error'
            );
          }
        });
      
      // Attach dev diagnostics
      attachChannelDiagnostics(channel, channelName);
      
      channelsRef.current.set(channelName, channel);
      return channel;
      
    } catch (error) {
      handleRealtimeError(error, `Setup channel ${channelName}`);
      
      setConnectionState('failed');
      
      // Fallback for setup errors
      if (!isUsingFallback) {
        startPollingFallback();
      }
    }
  }, [reconnectAttempts, diagnostics.firefoxDetected, isUsingFallback, startPollingFallback, stopPollingFallback, maxReconnectAttempts, handleRealtimeError, logChannelEvent, attachChannelDiagnostics]);

  // Setup all required channels
  const setupChannels = useCallback(() => {
    if (!user || !mountedRef.current) return;
    
    // DEV ONLY — диагностика Realtime
    if (import.meta.env.DEV) {
      console.debug('[RT][DEV] Current channels:', 
        supabase.getChannels().map(c => ({ topic: c.topic, state: c.state }))
      );
    }
    
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
      
      // Notifications channel
      setupChannel(
        'unified-notifications',
        'notifications',
        handleNotificationChange,
        `user_id=eq.${user.id}`
      );
      
      // Orders channel (for admin or users with orders)
      setupChannel(
        'unified-orders',
        'orders',
        handleOrderChange
      );
      
      // Message history channel (for admin only)
      if (profile?.user_type === 'admin') {
        setupChannel(
          'unified-message-history',
          'message_history',
          handleMessageHistoryChange
        );
      }
      
      // Profiles channel (for admin only)
      if (profile?.user_type === 'admin') {
        setupChannel(
          'unified-profiles',
          'profiles',
          handleProfileChange
        );
      }
      
      // Telegram notifications log channel (for admin only)
      if (profile?.user_type === 'admin') {
        setupChannel(
          'unified-telegram-logs',
          'telegram_notifications_log',
          handleTelegramLogChange
        );
      }
      
    } catch (error) {
      handleRealtimeError(error, 'Setting up channels');
    }
  }, [user, profile, setupChannel, handlePriceOfferChange, handleProductChange, handleNotificationChange, handleOrderChange, handleMessageHistoryChange, handleProfileChange, handleTelegramLogChange, handleRealtimeError]);

  // Main effect to manage realtime connections - only when JWT is ready
  useEffect(() => {
    if (!user || !realtimeReady) {
      // Cleanup when user logs out or realtime not ready
      channelsRef.current.forEach((channel, name) => {
        try {
          logChannelEvent('unsubscribe', name);
          channel.unsubscribe();
        } catch (error) {
          handleRealtimeError(error, `Cleanup channel ${name} on logout or token change`);
        }
      });
      channelsRef.current.clear();
      setIsConnected(false);
      setConnectionState('disconnected');
      
      if (!user) {
        console.log('🔧 [RT] User logged out, channels cleaned up');
      } else if (!realtimeReady) {
        console.log('🔧 [RT] Realtime not ready, waiting for JWT sync...');
      }
      return;
    }

    // At this point we have both user and realtime ready
    console.log('🔧 [RT] User and realtime ready, setting up channels...');
    
    mountedRef.current = true;
    
    // Initial data fetch
    fetchNotifications();
    
    // Setup channels with JWT ready
    setupChannels();
    
    // DEV ONLY — показать каналы после настройки
    if (import.meta.env.DEV) {
      setTimeout(() => {
        console.debug('[RT][DEV] Channels after setup:', 
          supabase.getChannels().map(c => ({ topic: c.topic, state: c.state }))
        );
      }, 1000);
    }

    return () => {
      mountedRef.current = false;
      
      // Cleanup channels
      channelsRef.current.forEach((channel, name) => {
        try {
          logChannelEvent('unsubscribe', name);
          channel.unsubscribe();
        } catch (error) {
          handleRealtimeError(error, `Cleanup channel ${name}`);
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
  }, [user, realtimeReady, setupChannels, fetchNotifications, logChannelEvent, handleRealtimeError]);

  // Initialize diagnostics and page visibility handlers
  useEffect(() => {
    const initDiagnostics = async () => {
      const wsSupport = detectWebSocketSupport();
      setDiagnostics(wsSupport);
      
      // Firefox warning removed - diagnostics now only on real channel errors
    };
    
    // Handle page visibility changes and network events
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('🔄 Page became visible, checking connection...');
        setTimeout(() => {
          if (mountedRef.current && !isConnected) {
            forceReconnect();
          }
        }, 1000);
      }
    };

    const handleOnline = () => {
      if (user) {
        console.log('🌐 Network came online, reconnecting...');
        setTimeout(() => {
          if (mountedRef.current) {
            forceReconnect();
          }
        }, 1000);
      }
    };

    const handleOffline = () => {
      console.log('🌐 Network went offline');
      setConnectionState('disconnected');
      setIsConnected(false);
    };
    
    initDiagnostics();
    
    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Dev mode: log active channels count
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        console.log(`📊 [RealtimeProvider] Active channels: ${channelsRef.current.size}`);
      }, 30000); // Log every 30 seconds
      
      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, isConnected, forceReconnect]);

  const contextValue: RealtimeContextType = {
    isConnected,
    connectionState,
    lastError,
    realtimeEvents,
    forceReconnect,
    diagnostics,
    isUsingFallback,
    reconnectAttempts,
    realtimeMode,
    // Notifications
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
};