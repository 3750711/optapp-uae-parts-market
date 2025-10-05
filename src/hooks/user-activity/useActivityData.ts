import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityFilters {
  eventType?: string;
  userId?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  search?: string;
}

export interface ActivityEvent {
  id: string;
  user_id: string | null;
  action_type: string;
  event_subtype: string | null;
  path: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  details: any;
  profiles?: {
    full_name: string | null;
    email: string | null;
    user_type: string | null;
  } | null;
}

export function useActivityData(filters: ActivityFilters = {}) {
  return useQuery({
    queryKey: ['user-activity', filters],
    queryFn: async () => {
      let query = supabase
        .from('event_logs')
        .select(`
          id,
          user_id,
          action_type,
          event_subtype,
          path,
          ip_address,
          user_agent,
          created_at,
          details,
          profiles:user_id (
            full_name,
            email,
            user_type
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      // Применяем фильтры
      if (filters.eventType && filters.eventType !== 'all') {
        query = query.eq('action_type', filters.eventType);
      }

      if (filters.userId && filters.userId !== 'all') {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.dateRange?.from) {
        query = query.gte('created_at', filters.dateRange.from.toISOString());
      }

      if (filters.dateRange?.to) {
        query = query.lte('created_at', filters.dateRange.to.toISOString());
      }

      if (filters.search) {
        query = query.or(`path.ilike.%${filters.search}%,event_subtype.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as ActivityEvent[];
    },
    refetchInterval: 30000, // Автообновление каждые 30 сек
    staleTime: 10000,
  });
}
