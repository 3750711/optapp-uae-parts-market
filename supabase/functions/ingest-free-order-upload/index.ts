import { createEdgeFunctionClient } from '../_shared/client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadEvent {
  user_id?: string;
  order_id?: string;
  file_url?: string;
  method?: string;
  duration_ms?: number;
  status: 'success' | 'error';
  error_details?: string;
  trace_id?: string;
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
    const supabase = createEdgeFunctionClient();
    
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

    // Prepare events for insertion
    const eventsToInsert = body.events.map(event => ({
      user_id: user.id,
      order_id: event.order_id || null,
      file_url: event.file_url || null,
      method: event.method || null,
      duration_ms: event.duration_ms || null,
      status: event.status,
      error_details: event.error_details || null,
      trace_id: event.trace_id || null,
    }));

    const { error: insertError } = await supabase
      .from('free_order_upload_logs')
      .insert(eventsToInsert);

    if (insertError) {
      console.error('Error inserting upload logs:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to store logs' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 202,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ingest-free-order-upload:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});