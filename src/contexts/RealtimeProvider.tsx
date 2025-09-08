import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { safeConnectRealtime, refreshRealtimeAuth, safeDisconnectRealtime, getRealtimeState } from '@/utils/realtimeManager';

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

  // Listen for auth events from AuthContext
  useEffect(() => {
    const handleAuthConnect = async (e: CustomEvent) => {
      const { session } = e.detail;
      if (session) {
        setConnectionState('connecting');
        try {
          await safeConnectRealtime(session);
          setIsConnected(true);
          setConnectionState('connected');
          setLastError(undefined);
        } catch (error) {
          console.error('[RT] Connection failed:', error);
          setConnectionState('failed');
          setLastError('Connection failed');
        }
      }
    };

    const handleAuthRefresh = (e: CustomEvent) => {
      const { session } = e.detail;
      if (session) {
        refreshRealtimeAuth(session);
      }
    };

    const handleAuthDisconnect = () => {
      safeDisconnectRealtime();
      setIsConnected(false);
      setConnectionState('disconnected');
      setLastError(undefined);
    };

    window.addEventListener('auth:connect', handleAuthConnect as EventListener);
    window.addEventListener('auth:refresh', handleAuthRefresh as EventListener);
    window.addEventListener('auth:disconnect', handleAuthDisconnect);

    return () => {
      window.removeEventListener('auth:connect', handleAuthConnect as EventListener);
      window.removeEventListener('auth:refresh', handleAuthRefresh as EventListener);
      window.removeEventListener('auth:disconnect', handleAuthDisconnect);
    };
  }, []);

  // Update local state based on realtime manager
  useEffect(() => {
    const updateState = () => {
      const state = getRealtimeState();
      setIsConnected(state.connected);
      setConnectionState(state.connected ? 'connected' : 'disconnected');
    };

    const interval = setInterval(updateState, 2000); // Check every 2s
    return () => clearInterval(interval);
  }, []);

  // Removed visibility change listener - now handled in AuthContext for better coordination

  const contextValue: RealtimeContextType = {
    isConnected,
    connectionState,
    lastError,
    realtimeEvents: [],
    forceReconnect: async () => {
      try {
        setReconnectAttempts(prev => prev + 1);
        safeDisconnectRealtime();
        
        if (status === 'authed' && session) {
          setConnectionState('connecting');
          await safeConnectRealtime(session);
          setIsConnected(true);
          setConnectionState('connected');
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