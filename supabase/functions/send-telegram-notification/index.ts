
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./config.ts";
import { handleOrderNotification } from "./order-notification.ts";
import { handleProductNotification } from "./product-notification.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log('Environment loaded and ready');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? "",
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    );

    // Parse request body
    const reqData = await req.json();
    console.log('Received request data:', reqData);

    // Handle different notification types
    if (reqData.order && reqData.action === 'create') {
      return await handleOrderNotification(reqData.order, supabaseClient, corsHeaders);
    } else if (reqData.productId) {
      return await handleProductNotification(reqData.productId, reqData.notificationType, supabaseClient, corsHeaders);
    } else {
      console.log('Invalid request data: missing order or productId');
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: either order+action or productId required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
