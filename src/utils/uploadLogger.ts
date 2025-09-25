import { supabase } from '@/integrations/supabase/client';

interface LogEvent {
  user_id?: string;
  product_id?: string;
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

// Fire-and-forget logging function with database fallback
export async function logUploadEvent(
  event: LogEvent, 
  options: { 
    context: 'free_order' | 'seller_product' | 'admin_product';
    product_id?: string;
  }
): Promise<void> {
  console.log('🔍 Starting upload log event:', { context: options.context, event });
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('📝 Upload log skipped: no user session');
      return;
    }

    const eventWithUser = {
      ...event,
      user_id: user.id,
      product_id: options.product_id || event.product_id,
      trace_id: event.trace_id || getTraceId(),
      context: options.context
    };

    console.log('📤 Sending upload log to Edge function:', { context: options.context, userId: user.id });

    // Try Edge Function first
    try {
      const { data, error } = await supabase.functions.invoke('ingest-product-upload', {
        body: { events: [eventWithUser] }
      });

      if (error) {
        console.warn('⚠️ Edge function error, using database fallback:', error.message || error);
        await logDirectlyToDatabase(eventWithUser);
      } else {
        console.log('✅ Upload log sent successfully via Edge function for context:', options.context);
      }
    } catch (edgeError) {
      console.warn('⚠️ Edge function unavailable, using database fallback:', edgeError instanceof Error ? edgeError.message : 'Unknown error');
      await logDirectlyToDatabase(eventWithUser);
    }
  } catch (error) {
    console.error('💥 Upload log failed completely:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Fallback: Direct database insertion
async function logDirectlyToDatabase(event: any): Promise<void> {
  try {
    const { error } = await supabase
      .from('product_upload_logs')
      .insert({
        user_id: event.user_id,
        product_id: event.product_id,
        order_id: event.order_id,
        file_url: event.file_url,
        method: event.method,
        duration_ms: event.duration_ms,
        status: event.status,
        error_details: event.error_details,
        trace_id: event.trace_id,
        original_size: event.original_size,
        compressed_size: event.compressed_size,
        compression_ratio: event.compression_ratio,
        context: event.context,
        step_name: 'image_upload',
        metadata: {}
      });

    if (error) {
      console.error('❌ Database fallback failed:', error.message || error);
    } else {
      console.log('✅ Upload log saved directly to database for context:', event.context);
    }
  } catch (dbError) {
    console.error('💥 Database fallback error:', dbError instanceof Error ? dbError.message : 'Unknown error');
  }
}
