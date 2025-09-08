import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { safeConnectRealtime, refreshRealtimeAuth, safeDisconnectRealtime, getRealtimeState } from '@/utils/realtimeManager';
import { FLAGS } from '@/config/flags';

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
  mode: 'on' | 'off';
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
      enabled: FLAGS.REALTIME_ENABLED,
      mode: FLAGS.REALTIME_ENABLED ? 'on' : 'off'
    };
  }
  return context;
};

export const RealtimeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { status } = useAuth();
  const [isConnected, setIsConnected] = React.useState(false);
  const [connectionState, setConnectionState] = React.useState<'connecting' | 'connected' | 'disconnected' | 'failed' | 'fallback'>('disconnected');
  const [lastError, setLastError] = React.useState<string>();
  const [reconnectAttempts, setReconnectAttempts] = React.useState(0);

  // Update local state based on realtime manager state
  useEffect(() => {
    if (!FLAGS.REALTIME_ENABLED) {
      setIsConnected(false);
      setConnectionState('disconnected');
      setLastError('Realtime disabled by configuration');
      return;
    }

    const updateState = () => {
      const state = getRealtimeState();
      setIsConnected(state.connected);
      setConnectionState(state.connected ? 'connected' : 'disconnected');
    };

    // Update immediately and then periodically
    updateState();
    const interval = setInterval(updateState, 5000); // Check every 5s (less frequent)
    return () => clearInterval(interval);
  }, []);

  const contextValue: RealtimeContextType = {
    isConnected,
    connectionState,
    lastError,
    realtimeEvents: [],
    forceReconnect: async () => {
      if (!FLAGS.REALTIME_ENABLED) {
        if (FLAGS.DEBUG_AUTH) {
          console.debug('🚫 Realtime disabled - no reconnect available');
        }
        return;
      }

      try {
        setReconnectAttempts(prev => prev + 1);
        // Use the centralized manager's force reconnect
        const { forceReconnect } = await import('@/utils/realtimeManager');
        forceReconnect();
      } catch (error) {
        if (FLAGS.DEBUG_AUTH) {
          console.debug('[RT] Force reconnect failed:', error);
        }
        setConnectionState('failed');
        setLastError('Force reconnect failed');
      }
    },
    diagnostics: { firefoxDetected: /Firefox/i.test(navigator.userAgent) },
    isUsingFallback: false,
    reconnectAttempts,
    enabled: FLAGS.REALTIME_ENABLED,
    mode: FLAGS.REALTIME_ENABLED ? 'on' : 'off'
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
};