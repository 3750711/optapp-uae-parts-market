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

// P1-2: Fire-and-forget logging function with retry logic
export async function logUploadEvent(
  event: LogEvent, 
  options: { 
    context: 'free_order' | 'seller_product' | 'admin_product';
    product_id?: string;
  }
): Promise<void> {
  console.log('🔍 Starting upload log event:', { context: options.context, event });
  
  const maxRetries = 2;
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
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

      // Use the new universal ingest function
      const { data, error } = await supabase.functions.invoke('ingest-product-upload', {
        body: { events: [eventWithUser] }
      });

      if (error) {
        console.error(`❌ Upload log error (attempt ${attempt + 1}):`, error.message || error);
        lastError = error;
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log(`🔄 Retrying upload log in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      } else {
        console.log('✅ Upload log sent successfully for context:', options.context);
        return; // Success, exit retry loop
      }
    } catch (error) {
      console.error(`💥 Upload log failed (attempt ${attempt + 1}):`, error instanceof Error ? error.message : 'Unknown error');
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`🔄 Retrying upload log in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('❌ Upload log failed after all retries:', lastError);
}
