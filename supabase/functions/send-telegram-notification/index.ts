// ======================== IMPORTANT NOTICE ========================
// Notification System Architecture v2.0.1
// 
// PRODUCTS (v2.0 Queue System):
// - New products, reposts, sold notifications
// - Uses NotificationQueueSystem with priorities, retries, DLQ
// - Async processing with rate limit handling
// 
// ORDERS (Legacy Direct System):
// - Order creation notifications handled by trigger_notify_on_new_order
// - Direct processing via order-notification.ts
// - NOT processed through v2.0 queue
// 
// Version: 2.0.1
// Last Updated: 2025-10-06
// ================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, BOT_TOKEN, PRODUCT_GROUP_CHAT_ID } from "./config.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { TelegramApiClient } from './TelegramApiClient.ts';
import { NotificationLogger } from './NotificationLogger.ts';
import { ProductNotificationHandler } from './ProductNotificationHandler.ts';
import { NotificationQueueSystem } from './NotificationQueueSystem.ts';

console.log("🚀 send-telegram-notification function started v2.0 (Queue System)");

// Check environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables");
}

if (!BOT_TOKEN) {
  console.error("❌ Missing TELEGRAM_BOT_TOKEN");
}

// Initialize global queue system
let queueSystem: NotificationQueueSystem | null = null;

async function initializeQueueSystem() {
  if (queueSystem) return queueSystem;

  const supabaseClient = createClient(
    SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false }
    }
  );

  const telegramClient = new TelegramApiClient(BOT_TOKEN!);
  const logger = new NotificationLogger(supabaseClient);
  const productHandler = new ProductNotificationHandler(
    telegramClient,
    logger,
    supabaseClient,
    PRODUCT_GROUP_CHAT_ID!
  );

  queueSystem = new NotificationQueueSystem(supabaseClient, productHandler);
  
  // Restore queue from database and start processing
  await queueSystem.restoreQueueFromDatabase();
  queueSystem.startProcessing();

  console.log("✅ Queue system initialized and started");
  
  return queueSystem;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize queue system
    const queue = await initializeQueueSystem();

    const requestData = await req.json();
    console.log("📨 Received request:", JSON.stringify(requestData, null, 2));

    // Only handle product notifications through v2.0 queue
    if (!requestData.productId) {
      console.error("❌ Invalid request data - productId required");
      return new Response(
        JSON.stringify({ 
          error: "Invalid request data",
          message: "v2.0 queue only handles product notifications. Orders use legacy system."
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const notificationType = requestData.notificationType || 'status_change';
    
    // Set priority based on notification type
    let priority = 'normal';
    if (notificationType === 'sold') {
      priority = 'high';
    } else if (notificationType === 'repost') {
      priority = 'normal';
    } else {
      priority = 'low';
    }

    const payload = {
      productId: requestData.productId,
      notificationType
    };

    // Enqueue product notification
    const queueId = await queue.enqueue('product', payload, priority);

    console.log(`✅ Product notification queued successfully: ${queueId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Product notification queued successfully",
        queueId,
        priority,
        notificationType
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("💥 Error in send-telegram-notification:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
