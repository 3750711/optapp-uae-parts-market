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

export const RealtimeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [connectionState, setConnectionState] = React.useState<'connecting' | 'connected' | 'disconnected' | 'failed' | 'fallback'>('disconnected');
  const [lastError, setLastError] = React.useState<string>();
  const [reconnectAttempts, setReconnectAttempts] = React.useState(0);
  const [hasValidSession, setHasValidSession] = React.useState(false);

  useEffect(() => {
    let supabase: any;
    let subscription: any;
    let timer: NodeJS.Timeout;
    
    const setupRealtime = async () => {
      try {
        supabase = await getSupabaseClient();
        
        const connectWithAuth = async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
              supabase.realtime.setAuth(session.access_token);
              if (!isConnected) {
                console.debug('[RT] Connecting with valid session');
                supabase.realtime.connect();
                setIsConnected(true);
                setConnectionState('connected');
                setHasValidSession(true);
              }
            } else {
              setHasValidSession(false);
              if (isConnected) {
                console.debug('[RT] Disconnecting - no valid session');
                supabase.realtime.disconnect();
                setIsConnected(false);
                setConnectionState('disconnected');
              }
            }
          } catch (error) {
            console.debug('[RT] Failed to connect with auth:', error);
            setLastError('Failed to authenticate connection');
            setConnectionState('failed');
          }
        };

        // Initial auth check - only connect if we have a session
        await connectWithAuth();

        // Listen for auth changes - be smarter about when to connect/disconnect
        subscription = supabase.auth.onAuthStateChange(async (event) => {
          console.debug('[RT] Auth event:', event);
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await connectWithAuth();
            setReconnectAttempts(prev => prev + 1);
          } else if (event === 'SIGNED_OUT') {
            setHasValidSession(false);
            try { 
              supabase.realtime.disconnect();
              setIsConnected(false);
              setConnectionState('disconnected');
              console.debug('[RT] Disconnected after sign out');
            } catch (error) {
              console.debug('[RT] Disconnect error:', error);
            }
          }
          // For INITIAL_SESSION: do nothing special - handled by connectWithAuth above
        });

        // Firefox watchdog - only run if we expect to be connected
        timer = setInterval(() => {
          if (!hasValidSession) return; // Don't try to reconnect if no session
          
          try {
            const state = supabase?.realtime?.socket?.connectionState?.();
            if (state && state !== 'open' && isConnected) {
              console.debug('[RT] Reconnecting, state=', state);
              supabase.realtime.connect();
              setConnectionState('connecting');
            }
          } catch (error) {
            console.debug('[RT] Watchdog error:', error);
          }
        }, 10000);

      } catch (error) {
        console.error('[RT] Setup failed:', error);
        setLastError('Setup failed');
        setConnectionState('failed');
      }
    };

    setupRealtime();
    
    return () => {
      if (subscription) subscription.unsubscribe();
      if (timer) clearInterval(timer);
      if (supabase?.realtime) {
        try {
          supabase.realtime.disconnect();
        } catch (error) {
          console.debug('[RT] Cleanup disconnect error:', error);
        }
      }
    };
  }, [isConnected, hasValidSession]);

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