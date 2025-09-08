import React, { useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { usePWALifecycle } from '@/hooks/usePWALifecycle';

interface RealtimeContextType {
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed' | 'fallback';
  lastError?: string;
  realtimeEvents: any[];
  forceReconnect: () => void;
  diagnostics: any;
  isUsingFallback: boolean;
  reconnectAttempts: number;
  enabled: boolean;
  mode: 'on';
}

const RealtimeContext = React.createContext<RealtimeContextType | null>(null);

export const useRealtime = () => {
  const context = React.useContext(RealtimeContext);
  if (!context) {
    // Return safe default values when context is not available
    return {
      isConnected: false,
      connectionState: 'disconnected' as const,
      lastError: 'Realtime context not available',
      realtimeEvents: [],
      forceReconnect: () => {},
      diagnostics: { firefoxDetected: false },
      isUsingFallback: false,
      reconnectAttempts: 0,
      enabled: true,
      mode: 'on' as const
    };
  }
  return context;
};

// Anti-duplication for connection attempts
let rtBound = false;
let rtConnectTick = 0;
let reconnectTimeout: NodeJS.Timeout | null = null;

export const RealtimeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [connectionState, setConnectionState] = React.useState<'connecting' | 'connected' | 'disconnected' | 'failed' | 'fallback'>('disconnected');
  const [lastError, setLastError] = React.useState<string>();
  const [reconnectAttempts, setReconnectAttempts] = React.useState(0);
  const supabaseRef = useRef<any>(null);
  const subscriptionRef = useRef<any>(null);

  // Safe realtime connection function
  const safeRealtimeConnect = React.useCallback(async () => {
    // Anti-duplication by time + state check
    const now = Date.now();
    if (now - rtConnectTick < 300) return;
    rtConnectTick = now;

    if (!supabaseRef.current) return;
    
    try {
      setConnectionState('connecting');
      const state = supabaseRef.current.realtime?.socket?.connectionState?.();
      if (state === 'open' || state === 'connecting') {
        setIsConnected(true);
        setConnectionState('connected');
        return;
      }

      // Firefox – short delay reduces "connection was interrupted"
      const delay = 300; // Consistent delay for mobile/PWA
      setTimeout(() => {
        try { 
          supabaseRef.current.realtime.connect();
          setIsConnected(true);
          setConnectionState('connected');
          setLastError(undefined);
        } catch (error) {
          if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
            console.debug('[RT] Connect error:', error);
          }
          setIsConnected(false);
          setConnectionState('failed');
          setLastError('Connection failed');
          
          // Auto-retry with exponential backoff
          const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          scheduleReconnection(backoffDelay);
        }
      }, delay);
    } catch (error) {
      if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
        console.debug('[RT] Safe connect error:', error);
      }
      setConnectionState('failed');
      setLastError('Setup error');
    }
  }, [reconnectAttempts]);

  // Schedule reconnection with exponential backoff
  const scheduleReconnection = React.useCallback((delay: number = 1000) => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    
    reconnectTimeout = setTimeout(() => {
      safeRealtimeConnect();
    }, delay);
  }, [safeRealtimeConnect]);

  // Check connection state and reconnect if needed
  const checkAndReconnect = React.useCallback(() => {
    if (!supabaseRef.current || !rtBound) return;
    
    try {
      const state = supabaseRef.current.realtime?.socket?.connectionState?.();
      if (state !== 'open' && state !== 'connecting') {
        if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
          console.debug('[RT] Connection check failed, reconnecting. State:', state);
        }
        safeRealtimeConnect();
      }
    } catch (error) {
      if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
        console.debug('[RT] Connection check error:', error);
      }
    }
  }, [safeRealtimeConnect]);

  // PWA lifecycle integration for mobile reconnection
  const { isPWA } = usePWALifecycle('realtime-provider', {
    onPageShow: () => {
      if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
        console.debug('[RT] PWA Page show - attempting reconnection');
      }
      scheduleReconnection(100); // Quick reconnect on page show
    },
    onResume: () => {
      if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
        console.debug('[RT] PWA Resume - attempting reconnection');
      }
      scheduleReconnection(200); // Quick reconnect on resume
    },
    onFocus: () => {
      if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
        console.debug('[RT] PWA Focus - checking connection');
      }
      checkAndReconnect();
    },
    onVisibilityChange: (isHidden) => {
      if (!isHidden) {
        if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
          console.debug('[RT] PWA Visibility restored - attempting reconnection');
        }
        scheduleReconnection(300); // Reconnect when visible
      }
    }
  });

  useEffect(() => {
    const setupRealtime = async () => {
      try {
        const supabase = await getSupabaseClient();
        supabaseRef.current = supabase;
        
        // Simplified auth state listener - only handle SIGNED_IN/SIGNED_OUT
        const subscription = supabase.auth.onAuthStateChange(async (event) => {
          if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
            console.debug('[RT] Auth event:', event);
          }
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || '';
            try { 
              supabase.realtime.setAuth(token); 
            } catch (error) {
              if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
                console.debug('[RT] SetAuth error:', error);
              }
            }
            await safeRealtimeConnect();
            rtBound = true;
            setReconnectAttempts(prev => prev + 1);
          }
          
          if (event === 'SIGNED_OUT') {
            rtBound = false;
            try { 
              supabase.realtime.disconnect();
              setIsConnected(false);
              setConnectionState('disconnected');
            } catch (error) {
              if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
                console.debug('[RT] Disconnect error:', error);
              }
            }
          }
        });
        
        subscriptionRef.current = subscription;

        // Add visibility change listener for additional mobile support
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible' && rtBound) {
            // Page became visible, check connection after a short delay
            setTimeout(checkAndReconnect, 500);
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Return cleanup function
        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };

      } catch (error) {
        console.error('[RT] Setup failed:', error);
        setLastError('Setup failed');
        setConnectionState('failed');
        // Don't return anything on error
        return undefined;
      }
    };

    let visibilityCleanup: (() => void) | undefined;
    
    setupRealtime().then((cleanup) => {
      visibilityCleanup = cleanup;
    });
    
    return () => {
      // Clear reconnection timeout
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      
      // Call visibility cleanup
      if (visibilityCleanup) {
        visibilityCleanup();
      }
      
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.unsubscribe();
        } catch (error) {
          if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
            console.debug('[RT] Cleanup subscription error:', error);
          }
        }
      }
      if (supabaseRef.current?.realtime && rtBound) {
        try {
          supabaseRef.current.realtime.disconnect();
        } catch (error) {
          if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
            console.debug('[RT] Cleanup disconnect error:', error);
          }
        }
      }
    };
  }, [safeRealtimeConnect, checkAndReconnect]);

  const contextValue: RealtimeContextType = {
    isConnected,
    connectionState,
    lastError,
    realtimeEvents: [],
    forceReconnect: async () => {
      try {
        setReconnectAttempts(prev => prev + 1);
        if (supabaseRef.current) {
          rtConnectTick = 0; // Reset throttle
          await safeRealtimeConnect();
        }
      } catch (error) {
        console.error('[RT] Force reconnect failed:', error);
        setConnectionState('failed');
        setLastError('Force reconnect failed');
      }
    },
    diagnostics: { firefoxDetected: /Firefox/i.test(navigator.userAgent) },
    isUsingFallback: false,
    reconnectAttempts,
    enabled: true,
    mode: 'on'
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
};