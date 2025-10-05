import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UserActivity {
  id: string;
  user_id: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  path: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: any;
  session_id: string | null;
  profiles: {
    full_name: string;
    email: string;
    user_type: string;
  } | null;
}

interface ActivityStats {
  action_type: string;
  count: number;
}

interface PopularPage {
  path: string;
  visits: number;
}

/**
 * Hook to fetch recent user activity from event_logs
 * Auto-refreshes every 30 seconds and on window focus
 */
export const useUserActivity = (limit: number = 100) => {
  return useQuery({
    queryKey: ['user-activity', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_logs')
        .select(`
          *,
          profiles!event_logs_user_id_fkey (
            full_name,
            email,
            user_type
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as UserActivity[];
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};

/**
 * Hook to fetch activity statistics grouped by action type
 * Auto-refreshes every 30 seconds
 * Optimized: Only fetches last 7 days of data
 */
export const useActivityStats = () => {
  return useQuery({
    queryKey: ['activity-stats'],
    queryFn: async () => {
      // Get data from last 7 days for better performance
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('event_logs')
        .select('action_type')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by action_type and count
      const stats: Record<string, number> = {};
      data.forEach((event) => {
        stats[event.action_type] = (stats[event.action_type] || 0) + 1;
      });

      return Object.entries(stats).map(([action_type, count]) => ({
        action_type,
        count,
      })) as ActivityStats[];
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 10000,
  });
};

/**
 * Hook to fetch most visited pages
 * Auto-refreshes every 30 seconds
 */
export const usePopularPages = (limit: number = 10) => {
  return useQuery({
    queryKey: ['popular-pages', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_logs')
        .select('path')
        .eq('action_type', 'page_view')
        .not('path', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1000); // Get last 1000 page views for analysis

      if (error) throw error;

      // Group by path and count
      const pathCounts: Record<string, number> = {};
      data.forEach((event) => {
        if (event.path) {
          pathCounts[event.path] = (pathCounts[event.path] || 0) + 1;
        }
      });

      // Convert to array and sort by count
      const popularPages = Object.entries(pathCounts)
        .map(([path, visits]) => ({ path, visits }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, limit);

      return popularPages as PopularPage[];
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 10000,
  });
};

/**
 * Hook to fetch activity for a specific user
 */
export const useUserActivityById = (userId: string | null, limit: number = 50) => {
  return useQuery({
    queryKey: ['user-activity-by-id', userId, limit],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('event_logs')
        .select(`
          *,
          profiles!event_logs_user_id_fkey (
            full_name,
            email,
            user_type
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as UserActivity[];
    },
    enabled: !!userId,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 10000,
  });
};

/**
 * Utility function to get action type color for badges
 */
export const getActionTypeColor = (actionType: string): string => {
  const colors: Record<string, string> = {
    login: 'bg-green-500/10 text-green-700 dark:text-green-400',
    login_success: 'bg-green-500/10 text-green-700 dark:text-green-400',
    login_failure: 'bg-red-500/10 text-red-700 dark:text-red-400',
    logout: 'bg-red-500/10 text-red-700 dark:text-red-400',
    page_view: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    button_click: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
    create: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    update: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    delete: 'bg-red-500/10 text-red-700 dark:text-red-400',
    api_call: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
    client_error: 'bg-red-500/10 text-red-700 dark:text-red-400',
    first_login_completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  };

  return colors[actionType] || 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
};

/**
 * Utility function to format action type label
 */
export const getActionTypeLabel = (actionType: string): string => {
  const labels: Record<string, string> = {
    login: 'Вход',
    login_success: 'Успешный вход',
    login_failure: 'Ошибка входа',
    logout: 'Выход',
    page_view: 'Просмотр страницы',
    button_click: 'Клик',
    create: 'Создание',
    update: 'Обновление',
    delete: 'Удаление',
    api_call: 'API вызов',
    client_error: 'Ошибка клиента',
    first_login_completed: 'Первый вход завершён',
  };

  return labels[actionType] || actionType;
};
