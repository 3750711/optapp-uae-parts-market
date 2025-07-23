
import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeSubscription {
  id: string;
  table: string;
  filter?: string;
  callback: (payload: any) => void;
  enabled: boolean;
}

class UnifiedRealtimeManager {
  private static instance: UnifiedRealtimeManager;
  private channels = new Map<string, RealtimeChannel>();
  private subscriptions = new Map<string, RealtimeSubscription>();
  private channelStatuses = new Map<string, string>();
  
  static getInstance(): UnifiedRealtimeManager {
    if (!UnifiedRealtimeManager.instance) {
      UnifiedRealtimeManager.instance = new UnifiedRealtimeManager();
    }
    return UnifiedRealtimeManager.instance;
  }

  subscribe(subscription: RealtimeSubscription): () => void {
    const { id, table, filter, callback, enabled } = subscription;
    
    if (!enabled) {
      return () => {};
    }

    console.log('🔄 Adding unified real-time subscription:', { id, table, filter });
    
    this.subscriptions.set(id, subscription);
    
    // Create or reuse channel for this table
    const channelKey = `${table}_${filter || 'all'}`;
    let channel = this.channels.get(channelKey);
    
    if (!channel) {
      console.log('🆕 Creating new unified channel for:', channelKey);
      
      channel = supabase
        .channel(`unified_${channelKey}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            ...(filter && { filter })
          },
          (payload) => {
            console.log('📡 Unified real-time event:', {
              channel: channelKey,
              event: payload.eventType,
              table: payload.table,
              timestamp: new Date().toISOString()
            });
            
            // Broadcast to all subscribers for this channel
            this.subscriptions.forEach((sub, subId) => {
              if (sub.table === table && sub.enabled) {
                try {
                  sub.callback(payload);
                } catch (error) {
                  console.error(`❌ Error in subscription ${subId}:`, error);
                }
              }
            });
          }
        )
        .subscribe((status) => {
          console.log(`📡 Unified channel ${channelKey} status:`, status);
          this.channelStatuses.set(channelKey, status);
          
          if (status === 'CHANNEL_ERROR') {
            console.error(`❌ Channel error for ${channelKey}, attempting reconnect...`);
            this.reconnectChannel(channelKey);
          }
        });
      
      this.channels.set(channelKey, channel);
    }

    // Return unsubscribe function
    return () => {
      console.log('🔌 Unsubscribing from unified real-time:', id);
      this.subscriptions.delete(id);
      
      // Clean up channel if no more subscriptions
      const remainingSubscriptions = Array.from(this.subscriptions.values())
        .filter(sub => sub.table === table && sub.enabled);
        
      if (remainingSubscriptions.length === 0) {
        console.log('🧹 Cleaning up unused channel:', channelKey);
        const channelToRemove = this.channels.get(channelKey);
        if (channelToRemove) {
          supabase.removeChannel(channelToRemove);
          this.channels.delete(channelKey);
          this.channelStatuses.delete(channelKey);
        }
      }
    };
  }

  private reconnectChannel(channelKey: string): void {
    console.log('🔄 Reconnecting channel:', channelKey);
    
    const oldChannel = this.channels.get(channelKey);
    if (oldChannel) {
      supabase.removeChannel(oldChannel);
    }
    
    // Find table name from channelKey
    const table = channelKey.split('_')[0];
    const filter = channelKey.includes('_') ? channelKey.split('_').slice(1).join('_') : undefined;
    
    // Recreate channel after delay
    setTimeout(() => {
      const newChannel = supabase
        .channel(`unified_${channelKey}_reconnect`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            ...(filter && filter !== 'all' && { filter })
          },
          (payload) => {
            this.subscriptions.forEach((sub, subId) => {
              if (sub.table === table && sub.enabled) {
                try {
                  sub.callback(payload);
                } catch (error) {
                  console.error(`❌ Error in subscription ${subId}:`, error);
                }
              }
            });
          }
        )
        .subscribe((status) => {
          console.log(`📡 Reconnected channel ${channelKey} status:`, status);
          this.channelStatuses.set(channelKey, status);
        });
      
      this.channels.set(channelKey, newChannel);
    }, 2000);
  }

  getChannelStatus(table: string, filter?: string): string | undefined {
    const channelKey = `${table}_${filter || 'all'}`;
    return this.channelStatuses.get(channelKey);
  }

  getAllChannelStatuses(): Record<string, string> {
    return Object.fromEntries(this.channelStatuses);
  }

  cleanup(): void {
    console.log('🧹 Cleaning up unified real-time manager');
    
    this.channels.forEach((channel, key) => {
      console.log(`🔌 Removing channel: ${key}`);
      supabase.removeChannel(channel);
    });
    
    this.channels.clear();
    this.subscriptions.clear();
    this.channelStatuses.clear();
  }
}

export const useUnifiedRealtimeManager = () => {
  const queryClient = useQueryClient();
  const manager = UnifiedRealtimeManager.getInstance();
  
  const subscribe = useCallback((subscription: RealtimeSubscription) => {
    return manager.subscribe(subscription);
  }, [manager]);
  
  const getChannelStatus = useCallback((table: string, filter?: string) => {
    return manager.getChannelStatus(table, filter);
  }, [manager]);
  
  const getAllChannelStatuses = useCallback(() => {
    return manager.getAllChannelStatuses();
  }, [manager]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't cleanup here as this is a global manager
      // Cleanup will happen when the app unmounts
    };
  }, []);
  
  return {
    subscribe,
    getChannelStatus,
    getAllChannelStatuses,
    cleanup: manager.cleanup.bind(manager)
  };
};
