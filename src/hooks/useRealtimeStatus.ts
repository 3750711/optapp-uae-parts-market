
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date>(new Date());

  useEffect(() => {
    // Monitor connection status
    const channel = supabase.channel('heartbeat')
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true);
        setLastHeartbeat(new Date());
      })
      .subscribe((status) => {
        console.log('📡 Connection status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Heartbeat check every 10 seconds
    const heartbeatInterval = setInterval(() => {
      const now = new Date();
      const timeSinceLastHeartbeat = now.getTime() - lastHeartbeat.getTime();
      
      // If no heartbeat for more than 30 seconds, consider disconnected
      if (timeSinceLastHeartbeat > 30000) {
        setIsConnected(false);
      }
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(heartbeatInterval);
    };
  }, [lastHeartbeat]);

  return {
    isConnected,
    lastHeartbeat
  };
};
