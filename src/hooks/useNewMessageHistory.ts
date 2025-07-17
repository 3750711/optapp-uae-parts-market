import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from './useDebounce';

interface ProfileData {
  id: string;
  full_name?: string;
  email: string;
}

interface MessageHistoryItem {
  id: string;
  created_at: string;
  updated_at: string;
  sender_id: string;
  recipient_ids: string[];
  recipient_group: string | null;
  message_text: string;
  image_urls: string[];
  status: 'processing' | 'completed' | 'partial_failure' | 'failed';
  sent_count: number;
  failed_count: number;
  error_details: any;
  senderName?: string;
}

interface MessageStats {
  total: number;
  completed: number;
  failed: number;
  processing: number;
}

interface UseNewMessageHistoryParams {
  searchQuery?: string;
  statusFilter?: string;
}

export const useNewMessageHistory = (params: UseNewMessageHistoryParams = {}) => {
  const [messages, setMessages] = useState<MessageHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<MessageStats>({ total: 0, completed: 0, failed: 0, processing: 0 });
  const [isLive, setIsLive] = useState(false);

  const debouncedSearchQuery = useDebounce(params.searchQuery || '', 300);

  const fetchMessageHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('message_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply status filter
      if (params.statusFilter && params.statusFilter !== 'all') {
        query = query.eq('status', params.statusFilter);
      }

      const { data: messageData, error } = await query;

      if (error) {
        console.error('Error fetching message history:', error);
        setMessages([]);
        return;
      }

      // Get sender names
      const senderIds = [...new Set(messageData?.map(msg => msg.sender_id) || [])];
      
      const { data: senderProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', senderIds);

      const senderMap = new Map<string, ProfileData>(senderProfiles?.map(p => [p.id, p]) || []);

      // Process messages with sender names
      let processedMessages = (messageData || []).map(msg => ({
        ...msg,
        senderName: senderMap.get(msg.sender_id)?.full_name || senderMap.get(msg.sender_id)?.email
      }));

      // Apply search filter
      if (debouncedSearchQuery) {
        processedMessages = processedMessages.filter(msg =>
          msg.message_text?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          msg.senderName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          msg.recipient_group?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
      }

      setMessages(processedMessages);

      // Calculate stats
      const newStats = {
        total: processedMessages.length,
        completed: processedMessages.filter(msg => msg.status === 'completed').length,
        failed: processedMessages.filter(msg => msg.status === 'failed' || msg.status === 'partial_failure').length,
        processing: processedMessages.filter(msg => msg.status === 'processing').length
      };
      setStats(newStats);

    } catch (error) {
      console.error('Error in fetchMessageHistory:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, params.statusFilter]);

  const refreshHistory = useCallback(() => {
    fetchMessageHistory();
  }, [fetchMessageHistory]);

  // Load history on mount and when filters change
  useEffect(() => {
    fetchMessageHistory();
  }, [fetchMessageHistory]);

  // Real-time subscription with fallback
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    console.log('🔌 Setting up real-time subscription for message_history');
    
    const channel = supabase
      .channel('message-history-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_history'
        },
        (payload) => {
          console.log('📨 Message history update received:', payload);
          fetchMessageHistory();
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          setIsLive(true);
          // Clear polling if realtime is working
          if (pollInterval) {
            clearInterval(pollInterval);
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn('⚠️ Realtime failed, falling back to polling');
          setIsLive(false);
          // Fallback to polling every 10 seconds
          pollInterval = setInterval(() => {
            console.log('🔄 Polling for message history updates (fallback)');
            fetchMessageHistory();
          }, 10000);
        }
      });

    // Initial check after 5 seconds to see if real-time is working
    const initialTimer = setTimeout(() => {
      if (channel.state !== 'joined') {
        console.log('🔄 Real-time not connected after 5s, enabling polling fallback');
        setIsLive(false);
        pollInterval = setInterval(() => {
          fetchMessageHistory();
        }, 10000);
      }
    }, 5000);

    return () => {
      console.log('🔌 Cleaning up message history subscription');
      clearTimeout(initialTimer);
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      supabase.removeChannel(channel);
      setIsLive(false);
    };
  }, [fetchMessageHistory]);

  return {
    messages,
    isLoading,
    stats,
    isLive,
    refreshHistory
  };
};