import { supabase } from '@/integrations/supabase/client';

interface LogEvent {
  user_id?: string;
  order_id?: string;
  file_url?: string;
  method?: string;
  duration_ms?: number;
  status: 'success' | 'error';
  error_details?: string;
  trace_id?: string;
}

// Generate trace ID for the session
let currentTraceId: string | null = null;

export function getTraceId(): string {
  if (!currentTraceId) {
    currentTraceId = crypto.randomUUID();
  }
  return currentTraceId;
}

export function resetTraceId(): void {
  currentTraceId = null;
}

// Fire-and-forget logging function
export async function logUploadEvent(event: LogEvent): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('📝 Upload log skipped: no user session');
      return;
    }

    const eventWithUser = {
      ...event,
      user_id: user.id,
      trace_id: event.trace_id || getTraceId()
    };

    // Use supabase functions invoke instead of direct HTTP calls
    const { error } = await supabase.functions.invoke('ingest-free-order-upload', {
      body: { events: [eventWithUser] }
    });

    if (error) {
      console.error('📝 Upload log error:', error);
    } else {
      console.log('📝 Upload log sent:', eventWithUser);
    }
  } catch (error) {
    // Silently fail - logging should not affect the main upload flow
    console.error('📝 Upload log failed (ignored):', error);
  }
}
