import React from 'react';
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
  mode: 'off';
}

const RealtimeContext = React.createContext<RealtimeContextType | null>(null);

export const useRealtime = () => {
  const context = React.useContext(RealtimeContext);
  if (!context) {
    // Return safe default values when context is not available
    return {
      isConnected: false,
      connectionState: 'disconnected' as const,
      lastError: FLAGS.REALTIME_ENABLED ? 'Realtime context not available' : 'Realtime disabled',
      realtimeEvents: [],
      forceReconnect: () => {},
      diagnostics: { firefoxDetected: false },
      isUsingFallback: false,
      reconnectAttempts: 0,
      enabled: FLAGS.REALTIME_ENABLED,
      mode: 'off' as const
    };
  }
  return context;
};

export const RealtimeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const contextValue: RealtimeContextType = {
    isConnected: false,
    connectionState: 'disconnected',
    lastError: FLAGS.REALTIME_ENABLED ? 'Realtime temporarily disabled for stability' : 'Realtime disabled by configuration',
    realtimeEvents: [],
    forceReconnect: () => {
      if (FLAGS.DEBUG_AUTH) {
        console.debug('🚫 Realtime disabled - no reconnect available');
      }
    },
    diagnostics: { firefoxDetected: false },
    isUsingFallback: false,
    reconnectAttempts: 0,
    enabled: FLAGS.REALTIME_ENABLED,
    mode: 'off'
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
};