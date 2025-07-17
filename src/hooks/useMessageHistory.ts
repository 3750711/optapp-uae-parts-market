import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from './useDebounce';
import { RealtimeChannel } from '@supabase/supabase-js';

interface MessageHistoryItem {
  id: string;
  created_at: string;
  action_type: string;
  entity_id: string;
  user_id: string;
  recipientName?: string;
  senderName?: string;
  details: {
    messageText: string;
    imageCount: number;
    status: 'success' | 'failed';
    error?: string;
    timestamp: string;
  };
}

interface MessageStats {
  total: number;
  sent: number;
  failed: number;
}

interface UseMessageHistoryParams {
  searchQuery?: string;
  statusFilter?: string;
}

interface ProfileData {
  id: string;
  full_name?: string;
  email: string;
}

export const useMessageHistory = (params: UseMessageHistoryParams = {}) => {
  const [messages, setMessages] = useState<MessageHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<MessageStats>({ total: 0, sent: 0, failed: 0 });
  const [isLive, setIsLive] = useState(false);

  const debouncedSearchQuery = useDebounce(params.searchQuery || '', 300);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('event_logs')
        .select(`
          id,
          created_at,
          action_type,
          entity_id,
          user_id,
          details
        `)
        .eq('action_type', 'bulk_message_send')
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply filters
      if (params.statusFilter && params.statusFilter !== 'all') {
        query = query.filter('details->status', 'eq', params.statusFilter);
      }

      const { data: logData, error } = await query;

      if (error) {
        console.error('Error fetching message history:', error);
        setMessages([]);
        return;
      }

      // Get recipient and sender names
      const recipientIds = [...new Set(logData?.map(log => log.entity_id) || [])];
      const senderIds = [...new Set(logData?.map(log => log.user_id).filter(Boolean) || [])];
      
      const { data: recipientProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', recipientIds);

      const { data: senderProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', senderIds);

      const recipientMap = new Map<string, ProfileData>(recipientProfiles?.map(p => [p.id, p]) || []);
      const senderMap = new Map<string, ProfileData>(senderProfiles?.map(p => [p.id, p]) || []);

      // Process messages with recipient and sender names
      let processedMessages = (logData || []).map(log => {
        const recipientProfile = recipientMap.get(log.entity_id);
        const senderProfile = senderMap.get(log.user_id);
        return {
          ...log,
          recipientName: recipientProfile?.full_name || recipientProfile?.email,
          senderName: senderProfile?.full_name || senderProfile?.email
        };
      });

      // Apply search filter
      if (debouncedSearchQuery) {
        processedMessages = processedMessages.filter(msg =>
          msg.details.messageText?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          msg.recipientName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          msg.senderName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
      }

      setMessages(processedMessages);

      // Calculate stats
      const newStats = {
        total: processedMessages.length,
        sent: processedMessages.filter(msg => msg.details.status === 'success').length,
        failed: processedMessages.filter(msg => msg.details.status === 'failed').length
      };
      setStats(newStats);

    } catch (error) {
      console.error('Error in fetchHistory:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshHistory = () => {
    fetchHistory();
  };

  // Load history on mount and when filters change
  useEffect(() => {
    fetchHistory();
  }, [debouncedSearchQuery, params.statusFilter]);

  // Real-time subscription with fallback
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_logs'
        },
        (payload) => {
          console.log('New message log received:', payload);
          fetchHistory();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          setIsLive(true);
          // Clear polling if realtime is working
          if (pollInterval) {
            clearInterval(pollInterval);
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Realtime failed, falling back to polling');
          setIsLive(false);
          // Fallback to polling every 5 seconds
          pollInterval = setInterval(() => {
            fetchHistory();
          }, 5000);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      setIsLive(false);
    };
  }, []);

  return {
    messages,
    isLoading,
    stats,
    isLive,
    refreshHistory
  };
};