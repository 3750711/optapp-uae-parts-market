
import { useState, useEffect, useRef, useCallback } from 'react';
import Pusher from 'pusher-js';
import { PusherConnectionState, PusherConfig } from '@/types/pusher';
import { useAuth } from '@/contexts/AuthContext';

const PUSHER_CONFIG: PusherConfig = {
  key: 'ea75c08dc00d482910a3',
  cluster: 'ap2',
  forceTLS: true,
};

export const usePusherConnection = () => {
  const { user } = useAuth();
  const [connectionState, setConnectionState] = useState<PusherConnectionState>({
    isConnected: false,
    connectionState: 'disconnected',
    reconnectAttempts: 0,
  });
  
  const pusherRef = useRef<Pusher | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!user || pusherRef.current) return;

    console.log('🔗 Pusher: Connecting...');
    
    // Enable logging in development
    if (process.env.NODE_ENV === 'development') {
      Pusher.logToConsole = true;
    }

    const pusher = new Pusher(PUSHER_CONFIG.key, {
      cluster: PUSHER_CONFIG.cluster,
      forceTLS: PUSHER_CONFIG.forceTLS,
      enabledTransports: ['ws', 'wss'],
      disabledTransports: ['xhr_polling', 'xhr_streaming', 'sockjs'],
    });

    pusher.connection.bind('connecting', () => {
      console.log('🔗 Pusher: Connecting...');
      setConnectionState(prev => ({ 
        ...prev, 
        connectionState: 'connecting' 
      }));
    });

    pusher.connection.bind('connected', () => {
      console.log('✅ Pusher: Connected');
      setConnectionState(prev => ({ 
        ...prev, 
        isConnected: true,
        connectionState: 'connected',
        reconnectAttempts: 0,
        lastError: undefined
      }));
    });

    pusher.connection.bind('disconnected', () => {
      console.log('❌ Pusher: Disconnected');
      setConnectionState(prev => ({ 
        ...prev, 
        isConnected: false,
        connectionState: 'disconnected'
      }));
    });

    pusher.connection.bind('failed', () => {
      console.log('💥 Pusher: Connection failed');
      setConnectionState(prev => ({ 
        ...prev, 
        isConnected: false,
        connectionState: 'failed',
        lastError: 'Connection failed'
      }));
    });

    pusher.connection.bind('error', (err: any) => {
      console.error('🚨 Pusher: Connection error:', err);
      setConnectionState(prev => ({ 
        ...prev, 
        lastError: err.message || 'Connection error'
      }));
    });

    pusherRef.current = pusher;
  }, [user]);

  const disconnect = useCallback(() => {
    if (pusherRef.current) {
      console.log('🔌 Pusher: Disconnecting...');
      pusherRef.current.disconnect();
      pusherRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setConnectionState(prev => ({ 
      ...prev, 
      isConnected: false,
      connectionState: 'disconnected'
    }));
  }, []);

  const forceReconnect = useCallback(() => {
    console.log('🔄 Pusher: Force reconnecting...');
    disconnect();
    
    setConnectionState(prev => ({ 
      ...prev, 
      reconnectAttempts: prev.reconnectAttempts + 1
    }));
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, 1000);
  }, [disconnect, connect]);

  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  const subscribeTo = useCallback((channel: string) => {
    if (!pusherRef.current) {
      console.warn('🚨 Pusher: Cannot subscribe - not connected');
      return null;
    }

    console.log(`📺 Pusher: Subscribing to channel: ${channel}`);
    return pusherRef.current.subscribe(channel);
  }, []);

  const unsubscribeFrom = useCallback((channel: string) => {
    if (!pusherRef.current) return;

    console.log(`📺 Pusher: Unsubscribing from channel: ${channel}`);
    pusherRef.current.unsubscribe(channel);
  }, []);

  return {
    connectionState,
    subscribeTo,
    unsubscribeFrom,
    forceReconnect,
    pusher: pusherRef.current,
  };
};
