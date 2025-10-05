import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PageViewLog {
  id: string;
  user_id: string | null;
  path: string | null;
  created_at: string;
  user_agent: string | null;
  details: any;
  profiles: {
    full_name: string;
    email: string;
    user_type: string;
  } | null;
}

interface PageViewByHour {
  hour: string;
  views: number;
}

interface PageViewByDay {
  day: string;
  views: number;
}

interface PageViewStats {
  total_views: number;
  unique_users: number;
  active_days: number;
  avg_per_user: number;
}

/**
 * Hook to fetch page_view events for today
 */
export const usePageViewsToday = () => {
  return useQuery({
    queryKey: ['page-views-today'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('event_logs')
        .select(`
          *,
          profiles (
            full_name,
            email,
            user_type
          )
        `)
        .eq('action_type', 'page_view')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PageViewLog[];
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to fetch page_view events grouped by hour (last 24 hours)
 */
export const usePageViewsByHour = () => {
  return useQuery({
    queryKey: ['page-views-by-hour'],
    queryFn: async () => {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data, error } = await supabase
        .from('event_logs')
        .select('created_at')
        .eq('action_type', 'page_view')
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by hour
      const hourlyStats: Record<string, number> = {};
      data.forEach((event) => {
        const date = new Date(event.created_at);
        const hour = `${date.getHours()}:00`;
        hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
      });

      // Create complete 24-hour timeline
      const result: PageViewByHour[] = [];
      for (let i = 0; i < 24; i++) {
        const hourLabel = `${i}:00`;
        result.push({
          hour: hourLabel,
          views: hourlyStats[hourLabel] || 0,
        });
      }

      return result;
    },
    refetchInterval: 60000, // Refresh every minute
  });
};

/**
 * Hook to fetch page_view events grouped by day (last 7 days)
 */
export const usePageViewsByDay = () => {
  return useQuery({
    queryKey: ['page-views-by-day'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('event_logs')
        .select('created_at')
        .eq('action_type', 'page_view')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by day
      const dailyStats: Record<string, number> = {};
      data.forEach((event) => {
        const date = new Date(event.created_at);
        const day = date.toISOString().split('T')[0];
        dailyStats[day] = (dailyStats[day] || 0) + 1;
      });

      // Convert to array
      const result: PageViewByDay[] = Object.entries(dailyStats).map(([day, views]) => ({
        day,
        views,
      }));

      return result.sort((a, b) => a.day.localeCompare(b.day));
    },
    refetchInterval: 60000,
  });
};

/**
 * Hook to fetch aggregated page_view statistics
 */
export const usePageViewStats = (days: number = 7) => {
  return useQuery({
    queryKey: ['page-view-stats', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('event_logs')
        .select('user_id, created_at')
        .eq('action_type', 'page_view')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Calculate stats
      const uniqueUsers = new Set(data.map(d => d.user_id).filter(Boolean));
      const uniqueDays = new Set(data.map(d => {
        return new Date(d.created_at).toISOString().split('T')[0];
      }));

      const stats: PageViewStats = {
        total_views: data.length,
        unique_users: uniqueUsers.size,
        active_days: uniqueDays.size,
        avg_per_user: uniqueUsers.size > 0 ? Math.round(data.length / uniqueUsers.size * 10) / 10 : 0,
      };

      return stats;
    },
    refetchInterval: 30000,
  });
};

/**
 * Hook to fetch page_view events with filters
 */
export const usePageViewsFiltered = (
  periodDays: number = 7,
  userId?: string,
  pathSearch?: string
) => {
  return useQuery({
    queryKey: ['page-views-filtered', periodDays, userId, pathSearch],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      let query = supabase
        .from('event_logs')
        .select(`
          *,
          profiles (
            full_name,
            email,
            user_type
          )
        `)
        .eq('action_type', 'page_view')
        .gte('created_at', startDate.toISOString());

      if (userId && userId !== 'all') {
        query = query.eq('user_id', userId);
      }

      if (pathSearch && pathSearch.trim()) {
        query = query.ilike('path', `%${pathSearch}%`);
      }

      query = query.order('created_at', { ascending: false }).limit(500);

      const { data, error } = await query;

      if (error) throw error;
      return data as PageViewLog[];
    },
    refetchInterval: 30000,
    enabled: true,
  });
};

/**
 * Get unique users from page views
 */
export const usePageViewUsers = () => {
  return useQuery({
    queryKey: ['page-view-users'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('event_logs')
        .select(`
          user_id,
          profiles (
            full_name,
            email
          )
        `)
        .eq('action_type', 'page_view')
        .gte('created_at', sevenDaysAgo.toISOString())
        .not('user_id', 'is', null);

      if (error) throw error;

      // Get unique users
      const uniqueUsers = new Map();
      data.forEach(item => {
        if (item.user_id && !uniqueUsers.has(item.user_id)) {
          uniqueUsers.set(item.user_id, {
            id: item.user_id,
            name: item.profiles?.full_name || 'Неизвестно',
            email: item.profiles?.email || '',
          });
        }
      });

      return Array.from(uniqueUsers.values());
    },
    refetchInterval: 60000,
  });
};
