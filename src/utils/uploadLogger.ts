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
  original_size?: number;
  compressed_size?: number;
  compression_ratio?: number;
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
  console.log('🔍 Starting upload log event:', event);
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('📝 Upload log skipped: no user session');
      return;
    }

    console.log('👤 User found for logging:', { id: user.id, email: user.email });

    const eventWithUser = {
      ...event,
      user_id: user.id,
      trace_id: event.trace_id || getTraceId()
    };

    console.log('📤 Sending upload log to Edge function:', eventWithUser);

    // Use supabase functions invoke instead of direct HTTP calls
    const { data, error } = await supabase.functions.invoke('ingest-free-order-upload', {
      body: { events: [eventWithUser] }
    });

    if (error) {
      console.error('❌ Upload log error:', error);
      // For debugging, let's see more details
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error; // Temporarily throw to see the actual error
    } else {
      console.log('✅ Upload log sent successfully:', { eventWithUser, response: data });
    }
  } catch (error) {
    // For debugging, let's see the actual errors instead of silently failing
    console.error('💥 Upload log failed:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    // Temporarily comment out silent fail for debugging
    // throw error;
  }
}
