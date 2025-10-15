import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log('🚀 Hookdeck Telegram Proxy starting up...');

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Hookdeck Proxy: Request received ===');
    console.log('Method:', req.method);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));
    
    // Parse incoming data from Hookdeck
    const data = await req.json();
    console.log('Hookdeck payload:', JSON.stringify(data, null, 2));
    
    // Get idempotency key from Hookdeck headers
    const idempotencyKey = req.headers.get('idempotency-key') || 
                          req.headers.get('x-hookdeck-requestid') ||
                          req.headers.get('x-hookdeck-eventid');
    
    console.log('Idempotency key:', idempotencyKey);
    
    // Get Supabase URL and Service Role Key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://api.partsbay.ae';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not found');
    }
    
    console.log('Calling send-telegram-notification with Service Role authentication...');
    
    // Call send-telegram-notification with Service Role Key
    // This bypasses JWT check since we're using server-side authentication
    const targetUrl = `${supabaseUrl}/functions/v1/send-telegram-notification`;
    console.log('Target URL:', targetUrl);
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        ...(idempotencyKey && { 'idempotency-key': idempotencyKey })
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    console.log('=== Hookdeck Proxy: Response from send-telegram-notification ===');
    console.log('Status:', response.status);
    console.log('Result:', JSON.stringify(result, null, 2));
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status 
      }
    );

  } catch (error) {
    console.error('=== Hookdeck Proxy: Error ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: 'Check Edge Function logs for more information'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
