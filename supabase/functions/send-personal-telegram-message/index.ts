// Personal Telegram message sender - unified architecture with notification system
// Based on the successful send-telegram-notification implementation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from "./config.ts";
import { verifyAdminAccess } from "./auth-utils.ts";
import { sendPersonalMessage } from "./personal-message.ts";

console.log('🚀 Personal Message Function starting up...');
console.log('Environment variables check:');
console.log('- SUPABASE_URL exists:', !!Deno.env.get('SUPABASE_URL'));
console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
console.log('- TELEGRAM_BOT_TOKEN exists:', !!Deno.env.get('TELEGRAM_BOT_TOKEN'));

serve(async (req) => {
  console.log('=== PERSONAL MESSAGE FUNCTION CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    const adminUser = await verifyAdminAccess(supabase, authHeader);

    // Parse request body
    const { user_id, message_text, images } = await req.json();
    console.log('Request data parsed:', {
      user_id: user_id ? 'provided' : 'missing',
      message_text: message_text ? `${message_text.length} chars` : 'missing',
      images: images ? `${images.length} images` : 'none'
    });

    if (!user_id || !message_text) {
      console.error('Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'user_id and message_text are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Send the personal message
    const result = await sendPersonalMessage(
      user_id,
      message_text,
      images,
      supabase,
      adminUser
    );

    console.log('Personal message sent successfully');

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('=== PERSONAL MESSAGE FUNCTION ERROR ===');
    console.error('Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error type'
    });

    // Determine appropriate status code based on error type
    let statusCode = 500;
    if (error.message.includes('authorization') || error.message.includes('Authentication')) {
      statusCode = 401;
    } else if (error.message.includes('Admin access required')) {
      statusCode = 403;
    } else if (error.message.includes('not found') || error.message.includes('missing')) {
      statusCode = 400;
    }

    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error?.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: statusCode 
      }
    );
  }
});