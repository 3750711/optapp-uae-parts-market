
// ======================== IMPORTANT NOTICE ========================
// This file orchestrates critical notification functionality.
// DO NOT EDIT unless absolutely necessary!
// 
// Any changes may affect both order and product notifications
// that send messages to Telegram. This system is currently working properly.
// 
// Version: 1.1.0
// Last Verified Working: 2025-06-21
// Change: Added support for resend notifications
// ================================================================

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./config.ts";
import { handleOrderNotification } from "./order-notification.ts";
import { handleProductNotification } from "./product-notification.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logTelegramNotification } from "../shared/telegram-logger.ts";

console.log('🚀 Edge Function starting up...');
console.log('Environment variables check:');
console.log('- SUPABASE_URL exists:', !!Deno.env.get('SUPABASE_URL'));
console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
console.log('- TELEGRAM_BOT_TOKEN exists:', !!Deno.env.get('TELEGRAM_BOT_TOKEN'));

serve(async (req) => {
  console.log('=== EDGE FUNCTION CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
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

    // Handle different request types
    if (reqData.order && (reqData.action === 'create' || reqData.action === 'status_change' || reqData.action === 'resend' || reqData.action === 'registered')) {
      const notificationType = reqData.action === 'registered' ? 'registered' : 'regular';
      return await handleOrderNotification(reqData.order, supabaseClient, corsHeaders, notificationType);
    } else if (reqData.productId) {
      // === PRODUCT NOTIFICATIONS: Route through QStash ===
      console.log('📮 [Router] Product notification detected, attempting QStash routing');
      
      // Get QSTASH_TOKEN from app_settings
      const { data: qstashSetting } = await supabaseClient
        .from('app_settings')
        .select('value')
        .eq('key', 'qstash_token')
        .maybeSingle();
      
      const QSTASH_TOKEN = qstashSetting?.value;
      
      if (!QSTASH_TOKEN || QSTASH_TOKEN === '') {
        console.warn('⚠️ [Router] QSTASH_TOKEN not configured, falling back to direct send');
        return await handleProductNotification(reqData.productId, reqData.notificationType, supabaseClient, corsHeaders, req, reqData.priceChanged, reqData.newPrice, reqData.oldPrice, reqData.requestId);
      }
      
      try {
        // Get functions_base_url from app_settings
        const { data: baseUrlSetting } = await supabaseClient
          .from('app_settings')
          .select('value')
          .eq('key', 'functions_base_url')
          .maybeSingle();
        
        const functionsBaseUrl = baseUrlSetting?.value || 'https://api.partsbay.ae';
        const destinationUrl = `${functionsBaseUrl}/functions/v1/upstash-repost-handler`;
        const qstashUrl = `https://qstash.upstash.io/v2/publish/${destinationUrl}`;
        
        console.log(`📤 [Router] Queuing to QStash: ${qstashUrl}`);
        
        const qstashResponse = await fetch(qstashUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${QSTASH_TOKEN}`,
            'Content-Type': 'application/json',
            'Upstash-Retries': '3',
            'Upstash-Deduplication-Id': reqData.requestId || `product-${reqData.productId}-${Date.now()}`,
            'Upstash-Forward-Queue': 'telegram-repost-queue'
          },
          body: JSON.stringify({
            productId: reqData.productId,
            notificationType: reqData.notificationType || 'status_change',
            priceChanged: reqData.priceChanged,
            newPrice: reqData.newPrice,
            oldPrice: reqData.oldPrice
          })
        });
        
        if (qstashResponse.ok) {
          const qstashResult = await qstashResponse.json();
          console.log('✅ [Router] Product notification queued via QStash:', qstashResult);
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Product notification queued via QStash',
              qstashMessageId: qstashResult.messageId 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.warn('⚠️ [Router] QStash queue failed, falling back to direct send');
      } catch (qstashError) {
        console.error('❌ [Router] QStash error:', qstashError);
        console.warn('⚠️ [Router] Falling back to direct send');
      }
      
      // Fallback: Direct send if QStash fails
      return await handleProductNotification(reqData.productId, reqData.notificationType, supabaseClient, corsHeaders, req, reqData.priceChanged, reqData.newPrice, reqData.oldPrice, reqData.requestId);
    } else {
      console.log('Invalid request data: missing required parameters');
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: order+action or productId required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
  } catch (error) {
    console.error('=== EDGE FUNCTION ERROR ===');
    console.error('Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error type'
    });

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error?.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
