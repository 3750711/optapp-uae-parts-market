import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

export interface TelegramNotificationLog {
  id: string;
  created_at: string;
  function_name: string;
  notification_type: string;
  recipient_type: 'personal' | 'group';
  recipient_identifier: string;
  recipient_name?: string;
  message_text: string;
  status: 'sent' | 'failed' | 'pending';
  telegram_message_id?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  error_details?: any;
  metadata?: any;
}

export interface TelegramNotificationFilters {
  function_name?: string;
  notification_type?: string;
  status?: string;
  recipient_type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface TelegramNotificationStats {
  total: number;
  sent: number;
  failed: number;
  today: number;
  functions: Array<{
    name: string;
    count: number;
  }>;
  types: Array<{
    type: string;
    count: number;
  }>;
}

export const useTelegramNotifications = (
  filters: TelegramNotificationFilters = {},
  page: number = 1,
  limit: number = 50
) => {
  return useQuery({
    queryKey: ['telegram-notifications', filters, page, limit],
    queryFn: async () => {
      let query = supabase
        .from('telegram_notifications_log')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.function_name) {
        query = query.eq('function_name', filters.function_name);
      }
      if (filters.notification_type) {
        query = query.eq('notification_type', filters.notification_type);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.recipient_type) {
        query = query.eq('recipient_type', filters.recipient_type);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters.search) {
        query = query.or(`message_text.ilike.%${filters.search}%,recipient_name.ilike.%${filters.search}%`);
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as TelegramNotificationLog[],
        count: count || 0,
        hasMore: count ? count > page * limit : false
      };
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useTelegramNotificationStats = () => {
  return useQuery({
    queryKey: ['telegram-notification-stats'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Efficient total counts using head:true
      const { count: totalCount, error: totalError } = await supabase
        .from('telegram_notifications_log')
        .select('*', { count: 'exact', head: true });
      if (totalError) throw totalError;

      const { count: sentCount, error: sentError } = await supabase
        .from('telegram_notifications_log')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent');
      if (sentError) throw sentError;

      const { count: failedCount, error: failedError } = await supabase
        .from('telegram_notifications_log')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed');
      if (failedError) throw failedError;

      // Today's count
      const { count: todayCount, error: todayError } = await supabase
        .from('telegram_notifications_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00Z`);
      if (todayError) throw todayError;

      // Function stats (last 7 days)
      const { data: functionData, error: functionError } = await supabase
        .from('telegram_notifications_log')
        .select('function_name, created_at')
        .gte('created_at', format(subDays(new Date(), 7), 'yyyy-MM-dd'));
      if (functionError) throw functionError;

      // Notification type stats (last 7 days)
      const { data: typeData, error: typeError } = await supabase
        .from('telegram_notifications_log')
        .select('notification_type, created_at')
        .gte('created_at', format(subDays(new Date(), 7), 'yyyy-MM-dd'));
      if (typeError) throw typeError;

      // Build counts
      const functionCounts: Record<string, number> = {};
      functionData?.forEach(item => {
        const key = (item as any).function_name || 'unknown';
        functionCounts[key] = (functionCounts[key] || 0) + 1;
      });

      const typeCounts: Record<string, number> = {};
      typeData?.forEach(item => {
        const key = (item as any).notification_type || 'unknown';
        typeCounts[key] = (typeCounts[key] || 0) + 1;
      });

      const stats: TelegramNotificationStats = {
        total: totalCount || 0,
        sent: sentCount || 0,
        failed: failedCount || 0,
        today: todayCount || 0,
        functions: Object.entries(functionCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        types: Object.entries(typeCounts)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count)
      };

      return stats;
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};