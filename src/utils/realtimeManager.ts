import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeState {
  connected: boolean;
  connecting: Promise<void> | null;
  channels: Set<string>;
  connectionAttempts: number;
}

const state: RealtimeState = {
  connected: false,
  connecting: null,
  channels: new Set(),
  connectionAttempts: 0
};

/**
 * Safely connect to Supabase Realtime with session auth
 */
export async function safeConnectRealtime(session?: Session | null): Promise<void> {
  if (state.connected) {
    if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
      console.debug('[RT] Already connected, skipping');
    }
    return;
  }

  if (state.connecting) {
    if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
      console.debug('[RT] Connection in progress, awaiting...');
    }
    return state.connecting;
  }

  state.connecting = (async () => {
    const startTime = Date.now();
    
    try {
      // Get token from session or current session
      const token = session?.access_token ?? (await supabase.auth.getSession()).data.session?.access_token;
      if (token) {
        supabase.realtime.setAuth(token);
      }
      
      // Check current socket state directly
      const socketState = (supabase as any).realtime?.socket?.connectionState?.();
      if (socketState === 'open' || socketState === 'connecting') {
        if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
          console.debug('[RT] Socket already active:', socketState);
        }
        state.connected = true;
        return;
      }

      // Direct connection without delay
      supabase.realtime.connect();
      state.connected = true;
      state.connectionAttempts = 0;
      
      const duration = Date.now() - startTime;
      if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
        console.debug(`[RT] Connected in ${duration}ms`);
      }
      
    } catch (error) {
      state.connectionAttempts++;
      const duration = Date.now() - startTime;
      
      if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
        console.debug(`[RT] Connection failed after ${duration}ms:`, error);
      }
      
      // Reset connection state on error
      state.connected = false;
    }
  })().finally(() => {
    state.connecting = null;
  });

  return state.connecting;
}

/**
 * Refresh Realtime auth token without reconnecting
 */
export function refreshRealtimeAuth(session?: Session | null): void {
  const token = session?.access_token;
  if (!token) return;
  
  try {
    supabase.realtime.setAuth(token);
    
    if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
      console.debug('[RT] Auth token refreshed');
    }
  } catch (error) {
    if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
      console.debug('[RT] Auth refresh failed:', error);
    }
  }
}

/**
 * Safely disconnect from Realtime and unsubscribe all channels
 */
export function safeDisconnectRealtime(): void {
  if (!state.connected) return;
  
  try {
    // Unsubscribe from all tracked channels
    const channels = Array.from(state.channels);
    channels.forEach(channelName => {
      try {
        const channel = supabase.channel(channelName);
        channel.unsubscribe();
        state.channels.delete(channelName);
      } catch (error) {
        if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
          console.debug('[RT] Failed to unsubscribe from channel:', channelName, error);
        }
      }
    });
    
    // Disconnect socket
    supabase.realtime.disconnect();
    state.connected = false;
    state.connectionAttempts = 0;
    
    if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
      console.debug('[RT] Disconnected and cleaned up channels');
    }
  } catch (error) {
    state.connected = false; // Force reset state
    if ((window as any).__PB_RUNTIME__?.DEBUG_AUTH) {
      console.debug('[RT] Disconnect failed:', error);
    }
  }
}

/**
 * Register a channel name for tracking
 */
export function registerChannel(channelName: string): void {
  state.channels.add(channelName);
}

/**
 * Unregister a channel name from tracking
 */
export function unregisterChannel(channelName: string): void {
  state.channels.delete(channelName);
}

/**
 * Get current realtime state for diagnostics
 */
export function getRealtimeState() {
  const socketState = (supabase as any).realtime?.socket?.connectionState?.();
  return {
    connected: state.connected,
    connecting: !!state.connecting,
    socketState,
    channelCount: state.channels.size,
    channels: Array.from(state.channels),
    connectionAttempts: state.connectionAttempts
  };
}

/**
 * Force reconnect (for manual triggers)
 */
export function forceReconnect(): void {
  if (state.connected) {
    safeDisconnectRealtime();
  }
  
  // Get current session to reconnect synchronously
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      safeConnectRealtime(session);
    }
  });
}