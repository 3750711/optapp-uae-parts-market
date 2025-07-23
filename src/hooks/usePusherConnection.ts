
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
  const subscribedChannels = useRef<Set<string>>(new Set());

  const connect = useCallback(() => {
    if (!user || pusherRef.current) return;

    console.log('🔗 Pusher: Connecting with config:', PUSHER_CONFIG);
    
    // Enable logging in development
    if (process.env.NODE_ENV === 'development') {
      Pusher.logToConsole = true;
    }

    const pusher = new Pusher(PUSHER_CONFIG.key, {
      cluster: PUSHER_CONFIG.cluster,
      forceTLS: PUSHER_CONFIG.forceTLS,
      enabledTransports: ['ws', 'wss'],
      disabledTransports: ['xhr_polling', 'xhr_streaming', 'sockjs'],
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
          'X-User-ID': user.id,
        },
      },
    });

    pusher.connection.bind('connecting', () => {
      console.log('🔗 Pusher: Connecting...');
      setConnectionState(prev => ({ 
        ...prev, 
        connectionState: 'connecting' 
      }));
    });

    pusher.connection.bind('connected', () => {
      console.log('✅ Pusher: Connected with socket ID:', pusher.connection.socket_id);
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

    pusher.connection.bind('unavailable', () => {
      console.warn('⚠️ Pusher: Connection unavailable');
      setConnectionState(prev => ({ 
        ...prev, 
        connectionState: 'failed',
        lastError: 'Connection unavailable'
      }));
    });

    pusherRef.current = pusher;
  }, [user]);

  const disconnect = useCallback(() => {
    if (pusherRef.current) {
      console.log('🔌 Pusher: Disconnecting...');
      // Unsubscribe from all channels
      subscribedChannels.current.forEach(channel => {
        pusherRef.current?.unsubscribe(channel);
      });
      subscribedChannels.current.clear();
      
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

    if (subscribedChannels.current.has(channel)) {
      console.log(`📺 Pusher: Already subscribed to channel: ${channel}`);
      return pusherRef.current.channel(channel);
    }

    console.log(`📺 Pusher: Subscribing to channel: ${channel}`);
    const channelInstance = pusherRef.current.subscribe(channel);
    
    channelInstance.bind('pusher:subscription_succeeded', () => {
      console.log(`✅ Pusher: Successfully subscribed to ${channel}`);
      subscribedChannels.current.add(channel);
    });

    channelInstance.bind('pusher:subscription_error', (error: any) => {
      console.error(`❌ Pusher: Subscription error for ${channel}:`, error);
      subscribedChannels.current.delete(channel);
    });

    return channelInstance;
  }, []);

  const unsubscribeFrom = useCallback((channel: string) => {
    if (!pusherRef.current) return;

    console.log(`📺 Pusher: Unsubscribing from channel: ${channel}`);
    pusherRef.current.unsubscribe(channel);
    subscribedChannels.current.delete(channel);
  }, []);

  return {
    connectionState,
    subscribeTo,
    unsubscribeFrom,
    forceReconnect,
    pusher: pusherRef.current,
    subscribedChannels: Array.from(subscribedChannels.current),
  };
};
