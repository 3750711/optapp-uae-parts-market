import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SessionDetails {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  last_activity_time: string | null;
  termination_reason: string;
  termination_details: string | null;
  session_timeout_minutes: number;
  profiles: {
    id: string;
    full_name: string;
    email: string;
    user_type: string;
  } | null;
}

interface EventLog {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  path: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: any;
}

export const useSessionDetails = (sessionId: string | undefined) => {
  return useQuery({
    queryKey: ['session-details', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');

      // Fetch session with profile
      const { data: session, error: sessionError } = await supabase
        .from('user_sessions')
        .select(`
          *,
          profiles!user_sessions_user_id_fkey (
            id,
            full_name,
            email,
            user_type
          )
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Fetch associated events
      const { data: events, error: eventsError } = await supabase
        .from('event_logs')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (eventsError) throw eventsError;

      return {
        session: session as SessionDetails,
        events: (events || []) as EventLog[]
      };
    },
    enabled: !!sessionId
  });
};
