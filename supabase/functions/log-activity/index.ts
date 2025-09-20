import { createServiceClient } from '../_shared/client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActivityEvent {
  event_type: 'login' | 'logout' | 'page_view' | 'button_click' | 'api_error' | 'client_error';
  event_subtype?: string;
  path?: string;
  metadata?: Record<string, any>;
  user_id?: string;
}

interface RequestBody {
  events: ActivityEvent[];
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
    console.log('Processing activity logging request');
    
    // Get user from auth header (optional for some events)
    const authHeader = req.headers.get('Authorization');
    let authenticatedUser = null;

    if (authHeader) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (!authError && user) {
        authenticatedUser = user;
      }
    }

    // Extract client info from headers
    const userAgent = req.headers.get('User-Agent') || undefined;
    const forwardedFor = req.headers.get('X-Forwarded-For') || 
                         req.headers.get('X-Real-IP') || 
                         undefined;

    const body: RequestBody = await req.json();

    if (!body.events || !Array.isArray(body.events)) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare events for insertion into event_logs table
    const eventsToInsert = body.events.map(event => ({
      action_type: event.event_type,
      entity_type: 'user_activity',
      entity_id: event.user_id || authenticatedUser?.id || null,
      user_id: event.user_id || authenticatedUser?.id || null,
      event_subtype: event.event_subtype || null,
      path: event.path || null,
      ip_address: forwardedFor || null,
      user_agent: userAgent || null,
      details: {
        ...event.metadata,
        timestamp: new Date().toISOString(),
        authenticated: !!authenticatedUser
      }
    }));

    const { error: insertError } = await supabase
      .from('event_logs')
      .insert(eventsToInsert);

    if (insertError) {
      console.error('❌ Error inserting activity logs:', {
        error: insertError,
        eventsCount: eventsToInsert.length,
        userId: authenticatedUser?.id,
        sampleEvent: eventsToInsert[0]
      });
      return new Response(JSON.stringify({ 
        error: 'Failed to store activity logs', 
        details: insertError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Successfully inserted', eventsToInsert.length, 'activity logs');

    return new Response(JSON.stringify({ success: true, inserted: eventsToInsert.length }), {
      status: 202,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in log-activity function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});