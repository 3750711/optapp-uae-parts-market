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

  useEffect(() => {
    let supabase: any;
    
    const setupRealtime = async () => {
      try {
        supabase = await getSupabaseClient();
        
        const refreshRT = async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || '';
            supabase.realtime.setAuth(token);
            setConnectionState('connecting');
          } catch (error) {
            console.debug('[RT] Failed to refresh auth:', error);
            setLastError('Failed to refresh auth');
          }
        };

        // Initial setup
        await refreshRT();
        supabase.realtime.connect();
        setIsConnected(true);
        setConnectionState('connected');

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
          if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
            await refreshRT();
            supabase.realtime.connect();
            setReconnectAttempts(prev => prev + 1);
          }
          if (event === 'SIGNED_OUT') {
            try { 
              supabase.realtime.disconnect();
              setIsConnected(false);
              setConnectionState('disconnected');
            } catch (error) {
              console.debug('[RT] Disconnect error:', error);
            }
          }
        });

        // Firefox watchdog - periodically check connection state
        const timer = setInterval(() => {
          try {
            const state = supabase?.realtime?.socket?.connectionState?.();
            if (state && state !== 'open' && isConnected) {
              console.debug('[RT] reconnect, state=', state);
              supabase.realtime.connect();
              setConnectionState('connecting');
            }
          } catch (error) {
            console.debug('[RT] Watchdog error:', error);
            setLastError('Watchdog error');
          }
        }, 10000);

        return () => { 
          subscription.unsubscribe(); 
          clearInterval(timer); 
        };
      } catch (error) {
        console.error('[RT] Setup failed:', error);
        setLastError('Setup failed');
        setConnectionState('failed');
      }
    };

    const cleanup = setupRealtime();
    return () => {
      cleanup.then(fn => fn?.());
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