import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from './useDebounce';

interface MessageHistoryItem {
  id: string;
  created_at: string;
  action_type: string;
  entity_id: string;
  user_id: string;
  recipientName?: string;
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

      // Get recipient names
      const recipientIds = [...new Set(logData?.map(log => log.entity_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', recipientIds);

      const profileMap = new Map<string, ProfileData>(profiles?.map(p => [p.id, p]) || []);

      // Process messages with recipient names and search filter
      let processedMessages = (logData || []).map(log => {
        const profile = profileMap.get(log.entity_id);
        return {
          ...log,
          recipientName: profile?.full_name || profile?.email
        };
      });

      // Apply search filter
      if (debouncedSearchQuery) {
        processedMessages = processedMessages.filter(msg =>
          msg.details.messageText?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          msg.recipientName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
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

  return {
    messages,
    isLoading,
    stats,
    refreshHistory
  };
};