import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const { status, session } = useAuth();
  const [isConnected, setIsConnected] = React.useState(false);
  const [connectionState, setConnectionState] = React.useState<'connecting' | 'connected' | 'disconnected' | 'failed' | 'fallback'>('disconnected');
  const [lastError, setLastError] = React.useState<string>();
  const [reconnectAttempts, setReconnectAttempts] = React.useState(0);
  const connectedRef = useRef(false);

  function safeConnect() {
    const state = (supabase as any).realtime?.socket?.connectionState?.();
    if (state === 'open' || state === 'connecting' || connectedRef.current) return;
    
    setTimeout(() => {
      try { 
        supabase.realtime.connect(); 
        connectedRef.current = true;
        setIsConnected(true);
        setConnectionState('connected');
        setLastError(undefined);
        
        if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
          console.debug('[RT] Connected successfully');
        }
      } catch (error) {
        if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
          console.debug('[RT] Connect error:', error);
        }
        setIsConnected(false);
        setConnectionState('failed');
        setLastError('Connection failed');
      }
    }, 150); // Firefox micro-delay
  }

  useEffect(() => {
    if (status === 'authed') {
      const token = session?.access_token || '';
      try { 
        supabase.realtime.setAuth(token); 
      } catch (error) {
        if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
          console.debug('[RT] SetAuth error:', error);
        }
      }
      safeConnect();
      return;
    }
    
    // guest/error → гасим сокет, чистим флаг
    try { 
      supabase.realtime.disconnect(); 
    } catch {}
    connectedRef.current = false;
    setIsConnected(false);
    setConnectionState('disconnected');
    
    if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
      console.debug('[RT] Disconnected due to auth status:', status);
    }
  }, [status, session?.access_token]);

  // на всякий случай обновляем токен при refresh (контекст уже обновит session)
  useEffect(() => {
    if (status === 'authed') {
      try { 
        supabase.realtime.setAuth(session?.access_token || ''); 
      } catch {}
    }
  }, [status, session?.access_token]);

  // Add visibility change listener for mobile support
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'authed') {
        // Page became visible, check connection after a short delay
        setTimeout(() => {
          if (status === 'authed') {
            safeConnect();
          }
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status]);

  const contextValue: RealtimeContextType = {
    isConnected,
    connectionState,
    lastError,
    realtimeEvents: [],
    forceReconnect: () => {
      try {
        setReconnectAttempts(prev => prev + 1);
        connectedRef.current = false; // Reset connection flag
        if (status === 'authed') {
          safeConnect();
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