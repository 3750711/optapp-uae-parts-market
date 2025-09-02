import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeTestEvent {
  timestamp: Date;
  event: string;
  productId?: string;
  buyerId?: string;
  hasNewData: boolean;
  hasOldData: boolean;
}

export const useMinimalRealtimeTest = (enabled: boolean = false) => {
  const [events, setEvents] = useState<RealtimeTestEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [testChannel, setTestChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (testChannel) {
        supabase.removeChannel(testChannel);
        setTestChannel(null);
      }
      setEvents([]);
      setIsConnected(false);
      return;
    }

    console.log('🧪 Starting minimal Real-time test...');

    const channel = supabase
      .channel('minimal_realtime_test')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_offers'
        },
        (payload) => {
          const event: RealtimeTestEvent = {
            timestamp: new Date(),
            event: payload.eventType,
            productId: (payload.new as any)?.product_id || (payload.old as any)?.product_id,
            buyerId: (payload.new as any)?.buyer_id || (payload.old as any)?.buyer_id,
            hasNewData: !!payload.new,
            hasOldData: !!payload.old
          };

          console.log('🧪 Test event received:', event);
          
          setEvents(prev => [event, ...prev.slice(0, 19)]); // Keep last 20 events
        }
      )
      .subscribe((status) => {
        console.log('🧪 Test channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    setTestChannel(channel);

    return () => {
      console.log('🧪 Cleaning up minimal test');
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [enabled]);

  const clearEvents = () => setEvents([]);

  return {
    events,
    isConnected,
    clearEvents,
    eventCount: events.length
  };
};