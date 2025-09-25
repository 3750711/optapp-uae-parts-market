
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { default: Pusher } = await import('npm:pusher@5.2.0');
    
    const pusher = new Pusher({
      appId: Deno.env.get('PUSHER_APP_ID'),
      key: Deno.env.get('PUSHER_KEY'),
      secret: Deno.env.get('PUSHER_SECRET'),
      cluster: Deno.env.get('PUSHER_CLUSTER') || 'ap2',
      useTLS: true,
    });

    const { channel, event, data } = await req.json();

    if (!channel || !event || !data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: channel, event, data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`📡 Pusher: Triggering event '${event}' on channel '${channel}'`);
    console.log('📄 Data:', JSON.stringify(data, null, 2));

    await pusher.trigger(channel, event, data);

    return new Response(
      JSON.stringify({ success: true, message: 'Event triggered successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Pusher trigger error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to trigger event', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
