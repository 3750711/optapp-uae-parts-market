
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { hmacSha256, md5 } from './crypto-utils.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Pusher credentials from environment
    const PUSHER_APP_ID = Deno.env.get('PUSHER_APP_ID');
    const PUSHER_KEY = Deno.env.get('PUSHER_KEY');
    const PUSHER_SECRET = Deno.env.get('PUSHER_SECRET');
    const PUSHER_CLUSTER = Deno.env.get('PUSHER_CLUSTER') || 'ap2';
    
    if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Missing Pusher credentials' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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

    // Generate authentication signature for Pusher HTTP API
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyString = JSON.stringify({
      name: event,
      channel,
      data: JSON.stringify(data)
    });
    
    const stringToSign = `POST\n/apps/${PUSHER_APP_ID}/events\nauth_key=${PUSHER_KEY}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${await md5(bodyString)}`;
    
    const signature = await hmacSha256(stringToSign, PUSHER_SECRET);
    
    // Make HTTP request to Pusher API
    const response = await fetch(`https://api-${PUSHER_CLUSTER}.pusherapp.com/apps/${PUSHER_APP_ID}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${PUSHER_KEY}, signature=${signature}, timestamp=${timestamp}, version=1.0`
      },
      body: bodyString
    });

    if (!response.ok) {
      throw new Error(`Pusher API error: ${response.status} ${response.statusText}`);
    }

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
