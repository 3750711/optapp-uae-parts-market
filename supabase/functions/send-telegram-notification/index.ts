
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
import { handleOrderNotificationQStash } from "./order-notification-qstash.ts";
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
      // === ORDERS: Route through QStash ===
      console.log('📮 [Router] Order notification detected, routing via QStash');
      const notificationType = reqData.action === 'registered' ? 'registered' : 'regular';
      return await handleOrderNotificationQStash(reqData.order, supabaseClient, corsHeaders, notificationType);
    } else if (reqData.productId) {
      // === PRODUCT NOTIFICATIONS: Route through QStash ONLY ===
      console.log('📮 [Router] Product notification detected, attempting QStash routing');
      
      // Get QSTASH_TOKEN from app_settings
      const { data: qstashSetting } = await supabaseClient
        .from('app_settings')
        .select('value')
        .eq('key', 'qstash_token')
        .maybeSingle();
      
      const QSTASH_TOKEN = qstashSetting?.value;
      
      if (!QSTASH_TOKEN || QSTASH_TOKEN === '') {
        console.error('❌ [Router] QSTASH_TOKEN not configured');
        
        // Log to event_logs for monitoring
        await supabaseClient.from('event_logs').insert({
          action_type: 'notification_failed',
          entity_type: 'product',
          entity_id: reqData.productId,
          details: {
            error: 'QSTASH_TOKEN not configured',
            notification_type: reqData.notificationType || 'status_change',
            timestamp: new Date().toISOString()
          }
        });
        
        return new Response(
          JSON.stringify({ 
            error: 'QStash not configured',
            details: 'QSTASH_TOKEN is required for product notifications'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
        );
      }
      
      try {
        // Get QStash endpoint name from app_settings
        const { data: endpointSetting } = await supabaseClient
          .from('app_settings')
          .select('value')
          .eq('key', 'qstash_endpoint_name')
          .maybeSingle();
        
        const endpointName = endpointSetting?.value || 'partsbay-repost';
        const qstashUrl = `https://qstash.upstash.io/v2/publish/${endpointName}`;
        
        console.log(`📤 [Router] Queuing to QStash endpoint: ${endpointName}`);
        
        const qstashResponse = await fetch(qstashUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${QSTASH_TOKEN}`,
            'Content-Type': 'application/json',
            'Upstash-Retries': '3',
            'Upstash-Deduplication-Id': reqData.requestId || `product-${reqData.productId}-${reqData.notificationType || 'status_change'}-${Math.floor(Date.now() / 1000)}`,
            'Upstash-Forward-Queue': 'telegram-notification-queue'
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
        
        // QStash returned non-OK response
        const errorText = await qstashResponse.text();
        console.error('❌ [Router] QStash queue failed:', errorText);
        
        // Log to event_logs for monitoring
        await supabaseClient.from('event_logs').insert({
          action_type: 'notification_failed',
          entity_type: 'product',
          entity_id: reqData.productId,
          details: {
            error: 'QStash queue failed',
            qstash_response: errorText,
            notification_type: reqData.notificationType || 'status_change',
            timestamp: new Date().toISOString()
          }
        });
        
        return new Response(
          JSON.stringify({ 
            error: 'QStash queue failed',
            details: errorText
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
        );
        
      } catch (qstashError) {
        console.error('❌ [Router] QStash error:', qstashError);
        
        // Log to event_logs for monitoring
        await supabaseClient.from('event_logs').insert({
          action_type: 'notification_failed',
          entity_type: 'product',
          entity_id: reqData.productId,
          details: {
            error: 'QStash connection error',
            error_message: qstashError?.message || 'Unknown error',
            notification_type: reqData.notificationType || 'status_change',
            timestamp: new Date().toISOString()
          }
        });
        
        return new Response(
          JSON.stringify({ 
            error: 'QStash connection error',
            details: qstashError?.message || 'Unknown error'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
        );
      }
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
