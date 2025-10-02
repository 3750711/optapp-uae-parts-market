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
    
    console.log('🔄 Starting INCREMENTAL user sessions computation...');
    
    // ✅ ШАГ 1: Получаем timestamp последней обработки из system_metadata
    const { data: lastCompute, error: metadataError } = await supabase
      .from('system_metadata')
      .select('value')
      .eq('key', 'last_session_compute_time')
      .single();

    if (metadataError) {
      console.warn('⚠️ Could not fetch last compute time, using 30 days ago:', metadataError.message);
    }

    // Если нет записи, берем 30 дней назад
    const lastComputeTime = lastCompute?.value 
      ? new Date(lastCompute.value)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    console.log('📅 Last compute time:', lastComputeTime.toISOString());
    
    // ✅ ШАГ 2: Получаем только НОВЫЕ события с момента последней обработки
    const { data: newEventLogs, error: logsError } = await supabase
      .from('event_logs')
      .select('id, user_id, action_type, created_at, details')
      .gte('created_at', lastComputeTime.toISOString())
      .not('user_id', 'is', null)
      .order('user_id')
      .order('created_at');

    if (logsError) {
      throw new Error(`Failed to fetch event logs: ${logsError.message}`);
    }

    console.log(`📊 Processing ${newEventLogs?.length || 0} NEW event logs (incremental)...`);

    // Если нет новых событий, ничего не делаем
    if (!newEventLogs || newEventLogs.length === 0) {
      console.log('✅ No new events to process');
      
      // Обновляем timestamp
      await supabase
        .from('system_metadata')
        .upsert({
          key: 'last_session_compute_time',
          value: new Date().toISOString()
        });

      return new Response(
        JSON.stringify({
          success: true,
          processedEvents: 0,
          affectedUsers: 0,
          computedSessions: 0,
          insertedSessions: 0,
          incremental: true,
          message: 'No new events to process'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ ШАГ 3: Определяем affected users (только те, у кого есть новые события)
    const affectedUsers = [...new Set(newEventLogs.map(log => log.user_id))];
    
    console.log(`👥 Computing sessions for ${affectedUsers.length} affected users...`);

    const computedSessions: UserSession[] = [];

    // ✅ ШАГ 4: Для каждого affected user получаем ВСЕ их события за 30 дней
    // (нужно для корректного вычисления сессий)
    for (const userId of affectedUsers) {
      const { data: userEvents, error: userEventsError } = await supabase
        .from('event_logs')
        .select('id, user_id, action_type, created_at, details')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at');

      if (userEventsError) {
        console.error(`Error fetching events for user ${userId}:`, userEventsError);
        continue;
      }

      if (userEvents && userEvents.length > 0) {
        const userSessions = computeSessionsForUser(userId, userEvents);
        computedSessions.push(...userSessions);
      }
    }

    console.log(`✅ Computed ${computedSessions.length} sessions for ${affectedUsers.length} users`);

    // ✅ ШАГ 5: Удаляем старые сессии ТОЛЬКО для affected users
    if (affectedUsers.length > 0) {
      const { error: deleteError } = await supabase
        .from('user_sessions')
        .delete()
        .in('user_id', affectedUsers)
        .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (deleteError) {
        console.error('⚠️ Error deleting old sessions:', deleteError);
      } else {
        console.log(`🗑️ Deleted old sessions for ${affectedUsers.length} users`);
      }
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

    console.log(`✅ Successfully inserted ${insertedCount} sessions`);

    // ✅ ШАГ 7: Обновляем timestamp последней обработки в system_metadata
    const { error: upsertError } = await supabase
      .from('system_metadata')
      .upsert({
        key: 'last_session_compute_time',
        value: new Date().toISOString()
      });

    if (upsertError) {
      console.error('⚠️ Error updating system_metadata:', upsertError);
    } else {
      console.log('✅ Updated last_session_compute_time');
    }

    return new Response(
      JSON.stringify({
        success: true,
        processedEvents: newEventLogs?.length || 0,
        affectedUsers: affectedUsers.length,
        computedSessions: computedSessions.length,
        insertedSessions: insertedCount,
        incremental: true, // ✅ Флаг инкрементальности
        lastComputeTime: lastComputeTime.toISOString(),
        newComputeTime: new Date().toISOString()
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