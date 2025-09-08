import React, { useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

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

export const RealtimeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [connectionState, setConnectionState] = React.useState<'connecting' | 'connected' | 'disconnected' | 'failed' | 'fallback'>('disconnected');
  const [lastError, setLastError] = React.useState<string>();
  const [reconnectAttempts, setReconnectAttempts] = React.useState(0);

  useEffect(() => {
    let supabase: any;
    let subscription: any;
    
    const safeRealtimeConnect = async () => {
      // Anti-duplication by time + state check
      const now = Date.now();
      if (now - rtConnectTick < 300) return;
      rtConnectTick = now;

      if (!supabase) return;
      
      try {
        const state = supabase.realtime?.socket?.connectionState?.();
        if (state === 'open' || state === 'connecting') return;

        // Firefox – short delay reduces "connection was interrupted"
        setTimeout(() => {
          try { 
            supabase.realtime.connect();
            setIsConnected(true);
            setConnectionState('connected');
          } catch (error) {
            if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
              console.debug('[RT] Connect error:', error);
            }
          }
        }, 150);
      } catch (error) {
        if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
          console.debug('[RT] Safe connect error:', error);
        }
      }
    };

    const setupRealtime = async () => {
      try {
        supabase = await getSupabaseClient();
        
        // Simplified auth state listener - only handle SIGNED_IN/SIGNED_OUT
        subscription = supabase.auth.onAuthStateChange(async (event) => {
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

      } catch (error) {
        console.error('[RT] Setup failed:', error);
        setLastError('Setup failed');
        setConnectionState('failed');
      }
    };

    setupRealtime();
    
    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
            console.debug('[RT] Cleanup subscription error:', error);
          }
        }
      }
      if (supabase?.realtime && rtBound) {
        try {
          supabase.realtime.disconnect();
        } catch (error) {
          if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
            console.debug('[RT] Cleanup disconnect error:', error);
          }
        }
      }
    };
  }, []);

  const contextValue: RealtimeContextType = {
    isConnected,
    connectionState,
    lastError,
    realtimeEvents: [],
    forceReconnect: async () => {
      try {
        const supabase = await getSupabaseClient();
        supabase.realtime.connect();
        setReconnectAttempts(prev => prev + 1);
      } catch (error) {
        console.error('[RT] Force reconnect failed:', error);
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