import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from "../_shared/client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventLog {
  id: string;
  user_id: string;
  action_type: string;
  created_at: string;
  details?: any;
}

interface UserSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  last_activity_time: string | null;
  termination_reason: 'active' | 'explicit_logout' | 'new_login' | 'timeout' | 'forced_logout';
  termination_details: string | null;
  session_timeout_minutes: number;
}

const SESSION_TIMEOUT_MINUTES = 30;
const LONG_SESSION_HOURS = 8;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();
    
    console.log('Starting user sessions computation...');
    
    // Get all event logs from the last 30 days, ordered by user and time
    const { data: eventLogs, error: logsError } = await supabase
      .from('event_logs')
      .select('id, user_id, action_type, created_at, details')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .not('user_id', 'is', null)
      .order('user_id')
      .order('created_at');

    if (logsError) {
      throw new Error(`Failed to fetch event logs: ${logsError.message}`);
    }

    console.log(`Processing ${eventLogs?.length || 0} event logs...`);

    // Group events by user
    const userEvents = new Map<string, EventLog[]>();
    eventLogs?.forEach(log => {
      if (!userEvents.has(log.user_id)) {
        userEvents.set(log.user_id, []);
      }
      userEvents.get(log.user_id)!.push(log);
    });

    const computedSessions: UserSession[] = [];

    // Process each user's events to compute sessions
    for (const [userId, events] of userEvents) {
      const userSessions = computeSessionsForUser(userId, events);
      computedSessions.push(...userSessions);
    }

    console.log(`Computed ${computedSessions.length} sessions`);

    // Clear existing sessions and insert new ones
    const { error: clearError } = await supabase
      .from('user_sessions')
      .delete()
      .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (clearError) {
      console.error('Error clearing sessions:', clearError);
    }

    // Insert computed sessions in batches
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < computedSessions.length; i += batchSize) {
      const batch = computedSessions.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('user_sessions')
        .insert(batch.map(session => ({
          user_id: session.user_id,
          started_at: session.started_at,
          ended_at: session.ended_at,
          last_activity_time: session.last_activity_time,
          termination_reason: session.termination_reason,
          termination_details: session.termination_details,
          session_timeout_minutes: session.session_timeout_minutes
        })));

      if (insertError) {
        console.error('Error inserting batch:', insertError);
      } else {
        insertedCount += batch.length;
      }
    }

    console.log(`Successfully inserted ${insertedCount} sessions`);

    return new Response(
      JSON.stringify({
        success: true,
        processedEvents: eventLogs?.length || 0,
        computedSessions: computedSessions.length,
        insertedSessions: insertedCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in compute-user-sessions:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function computeSessionsForUser(userId: string, events: EventLog[]): UserSession[] {
  const sessions: UserSession[] = [];
  let currentSession: Partial<UserSession> | null = null;

  // Sort events by timestamp
  events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const eventTime = new Date(event.created_at);

    // Check if this is a login event
    if (event.action_type === 'login') {
      // End current session if exists
      if (currentSession) {
        currentSession.ended_at = event.created_at;
        currentSession.termination_reason = 'new_login';
        currentSession.termination_details = 'New login detected';
        sessions.push(currentSession as UserSession);
      }

      // Start new session
      currentSession = {
        id: crypto.randomUUID(),
        user_id: userId,
        started_at: event.created_at,
        ended_at: null,
        last_activity_time: event.created_at,
        termination_reason: 'active',
        termination_details: null,
        session_timeout_minutes: SESSION_TIMEOUT_MINUTES
      };
    }

    // Check if this is a logout event
    else if (event.action_type === 'logout' && currentSession) {
      currentSession.ended_at = event.created_at;
      currentSession.last_activity_time = event.created_at;
      currentSession.termination_reason = 'explicit_logout';
      currentSession.termination_details = 'User logged out explicitly';
      sessions.push(currentSession as UserSession);
      currentSession = null;
    }

    // Check for forced logout events
    else if ((event.action_type === 'admin_forced_logout' || event.action_type === 'forced_logout') && currentSession) {
      currentSession.ended_at = event.created_at;
      currentSession.last_activity_time = event.created_at;
      currentSession.termination_reason = 'forced_logout';
      currentSession.termination_details = `Forced logout: ${event.details?.reason || 'Administrative action'}`;
      sessions.push(currentSession as UserSession);
      currentSession = null;
    }

    // Update last activity for activity events
    else if (currentSession && isActivityEvent(event.action_type)) {
      currentSession.last_activity_time = event.created_at;
    }

    // Check for timeout
    if (currentSession && i < events.length - 1) {
      const nextEvent = events[i + 1];
      const timeDiff = new Date(nextEvent.created_at).getTime() - eventTime.getTime();
      const timeoutMs = SESSION_TIMEOUT_MINUTES * 60 * 1000;

      if (timeDiff > timeoutMs) {
        currentSession.ended_at = new Date(eventTime.getTime() + timeoutMs).toISOString();
        currentSession.termination_reason = 'timeout';
        currentSession.termination_details = `Session timed out after ${SESSION_TIMEOUT_MINUTES} minutes of inactivity`;
        sessions.push(currentSession as UserSession);
        currentSession = null;
      }
    }
  }

  // Handle active session
  if (currentSession) {
    const now = new Date();
    const lastActivity = new Date(currentSession.last_activity_time!);
    const timeDiff = now.getTime() - lastActivity.getTime();
    const timeoutMs = SESSION_TIMEOUT_MINUTES * 60 * 1000;

    if (timeDiff > timeoutMs) {
      currentSession.ended_at = new Date(lastActivity.getTime() + timeoutMs).toISOString();
      currentSession.termination_reason = 'timeout';
      currentSession.termination_details = `Session timed out after ${SESSION_TIMEOUT_MINUTES} minutes of inactivity`;
    } else {
      currentSession.termination_reason = 'active';
      currentSession.termination_details = null;
    }

    sessions.push(currentSession as UserSession);
  }

  return sessions;
}

function isActivityEvent(actionType: string): boolean {
  const activityEvents = [
    'page_view', 'button_click', 'api_call', 'search', 'filter',
    'product_view', 'order_create', 'message_send', 'upload'
  ];
  
  return activityEvents.includes(actionType) || actionType.startsWith('action_');
}