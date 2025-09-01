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
      setEvents([]);
      setIsConnected(false);
      return;
    }

    // Test subscription is disabled - use RealtimeProvider instead
    console.log('🧪 Test subscription disabled - using RealtimeProvider');
    setIsConnected(true);
    
    // Mock some test events for UI testing
    const mockEvent: RealtimeTestEvent = {
      timestamp: new Date(),
      event: 'TEST_DISABLED',
      hasNewData: true,
      hasOldData: false
    };
    
    setEvents([mockEvent]);
  }, [enabled]);

  const clearEvents = () => setEvents([]);

  return {
    events,
    isConnected,
    clearEvents,
    eventCount: events.length
  };
};