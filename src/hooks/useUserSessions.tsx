import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  last_activity_time: string | null;
  termination_reason: 'active' | 'explicit_logout' | 'new_login' | 'timeout' | 'forced_logout';
  termination_details: string | null;
  session_timeout_minutes: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  terminationReasons: Record<string, number>;
  avgDurationByReason: Record<string, number>;
  longSessions: number;
}

export const SESSION_TIMEOUT_MINUTES = 30;
export const LONG_SESSION_HOURS = 8;

export function useUserSessions(limit = 100) {
  return useQuery({
    queryKey: ['user-sessions', limit],
    queryFn: async () => {
      try {
        // Получаем сессии
        const { data: sessions, error } = await supabase
          .from('user_sessions')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(limit);

        if (error) {
          console.error('Error fetching user sessions:', error);
          throw error;
        }

        // Получаем user_id всех пользователей
        const userIds = [...new Set(sessions?.map(s => s.user_id) || [])];
        
        if (userIds.length === 0) {
          return [];
        }

        // Загружаем профили отдельным запросом
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, user_type')
          .in('id', userIds);

        // Объединяем данные
        return sessions.map(session => ({
          ...session,
          profiles: profiles?.find(p => p.id === session.user_id) || null
        })) as (UserSession & {
          profiles: {
            full_name: string | null;
            email: string;
            user_type: string;
          } | null;
        })[];
      } catch (error: any) {
        console.error('Error in useUserSessions:', error);
        toast.error('Не удалось загрузить сессии пользователей');
        throw error;
      }
    }
  });
}

export function useSessionStats() {
  return useQuery({
    queryKey: ['session-stats'],
    queryFn: async (): Promise<SessionStats> => {
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*');

      if (error) {
        throw error;
      }

      const totalSessions = sessions.length;
      const activeSessions = sessions.filter(s => s.termination_reason === 'active').length;
      
      // Count termination reasons
      const terminationReasons: Record<string, number> = {};
      sessions.forEach(session => {
        const reason = session.termination_reason || 'unknown';
        terminationReasons[reason] = (terminationReasons[reason] || 0) + 1;
      });

      // Calculate average duration by reason
      const avgDurationByReason: Record<string, number> = {};
      const durationsByReason: Record<string, number[]> = {};
      
      sessions.forEach(session => {
        const reason = session.termination_reason || 'unknown';
        if (!durationsByReason[reason]) {
          durationsByReason[reason] = [];
        }
        
        const startTime = new Date(session.started_at).getTime();
        const endTime = session.ended_at ? 
          new Date(session.ended_at).getTime() : 
          Date.now();
        
        const durationMinutes = (endTime - startTime) / (1000 * 60);
        durationsByReason[reason].push(durationMinutes);
      });

      Object.keys(durationsByReason).forEach(reason => {
        const durations = durationsByReason[reason];
        const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        avgDurationByReason[reason] = avg;
      });

      // Count long sessions
      const longSessionThresholdMs = LONG_SESSION_HOURS * 60 * 60 * 1000;
      const longSessions = sessions.filter(session => {
        const startTime = new Date(session.started_at).getTime();
        const endTime = session.ended_at ? 
          new Date(session.ended_at).getTime() : 
          Date.now();
        return (endTime - startTime) > longSessionThresholdMs;
      }).length;

      return {
        totalSessions,
        activeSessions,
        terminationReasons,
        avgDurationByReason,
        longSessions
      };
    }
  });
}

export function useComputeUserSessions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      console.log('Computing user sessions...');
      
      const { data, error } = await supabase.functions.invoke('compute-user-sessions', {
        method: 'POST'
      });

      if (error) {
        console.error('Error computing sessions:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(`Вычислено ${data.computedSessions} сессий из ${data.processedEvents} событий`);
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-stats'] });
    },
    onError: (error: any) => {
      console.error('Error computing sessions:', error);
      toast.error(`Ошибка вычисления сессий: ${error.message}`);
    }
  });
}

export function getTerminationReasonColor(reason: string | null): string {
  switch (reason) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'explicit_logout':
      return 'bg-blue-100 text-blue-800';
    case 'new_login':
      return 'bg-yellow-100 text-yellow-800';
    case 'timeout':
      return 'bg-orange-100 text-orange-800';
    case 'forced_logout':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getTerminationReasonLabel(reason: string | null): string {
  switch (reason) {
    case 'active':
      return 'Активна';
    case 'explicit_logout':
      return 'Выход';
    case 'new_login':
      return 'Новый вход';
    case 'timeout':
      return 'Тайм-аут';
    case 'forced_logout':
      return 'Принуд. выход';
    default:
      return 'Неизвестно';
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}м`;
  } else if (minutes < 24 * 60) {
    const hours = Math.round(minutes / 60 * 10) / 10;
    return `${hours}ч`;
  } else {
    const days = Math.round(minutes / (24 * 60) * 10) / 10;
    return `${days}д`;
  }
}

export function isLongSession(startTime: string, endTime: string | null): boolean {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const durationMs = end - start;
  return durationMs > (LONG_SESSION_HOURS * 60 * 60 * 1000);
}