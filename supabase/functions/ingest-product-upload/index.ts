import { createServiceClient } from '../_shared/client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadEvent {
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
  context: 'free_order' | 'seller_product' | 'admin_product';
  step_name?: string;
  metadata?: Record<string, any>;
}

interface RequestBody {
  events: UploadEvent[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createServiceClient();
    console.log('🔧 Universal upload logging service started');
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: RequestBody = await req.json();

    if (!body.events || !Array.isArray(body.events)) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate context in each event
    for (const event of body.events) {
      if (!event.context || !['free_order', 'seller_product', 'admin_product'].includes(event.context)) {
        return new Response(JSON.stringify({ error: `Invalid context: ${event.context}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Prepare events for insertion
    const eventsToInsert = body.events.map(event => ({
      user_id: user.id,
      product_id: event.product_id || null,
      order_id: event.order_id || null,
      file_url: event.file_url || null,
      method: event.method || null,
      duration_ms: event.duration_ms || null,
      status: event.status,
      error_details: event.error_details || null,
      trace_id: event.trace_id || null,
      original_size: event.original_size || null,
      compressed_size: event.compressed_size || null,
      compression_ratio: event.compression_ratio || null,
      context: event.context,
      step_name: event.step_name || 'image_upload',
      metadata: event.metadata || {},
    }));

    const { error: insertError } = await supabase
      .from('product_upload_logs')
      .insert(eventsToInsert);

    if (insertError) {
      console.error('❌ Error inserting upload logs:', {
        error: insertError.message,
        eventsCount: eventsToInsert.length,
        userId: user.id,
        contexts: [...new Set(body.events.map(e => e.context))]
      });
      return new Response(JSON.stringify({ error: 'Failed to store logs', details: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Successfully inserted', eventsToInsert.length, 'upload logs for user', user.id, 
      'contexts:', [...new Set(body.events.map(e => e.context))]);

    return new Response(JSON.stringify({ success: true }), {
      status: 202,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in ingest-product-upload:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});