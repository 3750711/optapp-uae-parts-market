import { FLAGS } from '@/config/flags';
import { supabase } from '@/integrations/supabase/client';

/**
 * Get current realtime status for diagnostics
 */
export function getRealtimeStatus() {
  const isEnabled = FLAGS.REALTIME_ENABLED;
  
  if (!isEnabled) {
    return {
      enabled: false,
      connected: false,
      socketState: 'disabled',
      channelCount: 0,
      channels: [],
      message: 'Realtime disabled by configuration'
    };
  }

  try {
    const channels = supabase.getChannels();
    const socketState = (supabase as any).realtime?.socket?.connectionState?.() || 'unknown';
    
    return {
      enabled: true,
      connected: socketState === 'open',
      socketState,
      channelCount: channels.length,
      channels: channels.map(ch => ({
        topic: (ch as any).topic,
        state: (ch as any).state
      })),
      message: socketState === 'open' ? 'Connected' : `Socket state: ${socketState}`
    };
  } catch (error) {
    return {
      enabled: true,
      connected: false,
      socketState: 'error',
      channelCount: 0,
      channels: [],
      message: `Error: ${error.message}`
    };
  }
}

/**
 * Simple check if realtime should be available
 */
export function shouldUseRealtime(): boolean {
  return FLAGS.REALTIME_ENABLED;
}

/**
 * Log realtime status for debugging
 */
export function logRealtimeStatus() {
  const status = getRealtimeStatus();
  
  if (FLAGS.DEBUG_AUTH) {
    console.debug('[REALTIME_STATUS]', status);
  }
  
  return status;
}