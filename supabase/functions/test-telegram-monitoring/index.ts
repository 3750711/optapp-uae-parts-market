import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logTelegramNotification } from "../shared/telegram-logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? "",
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    );

    console.log('🧪 Testing Telegram monitoring system...');

    // Test successful notification
    await logTelegramNotification(supabase, {
      function_name: 'test-telegram-monitoring',
      notification_type: 'test_success',
      recipient_type: 'personal',
      recipient_identifier: '123456789',
      recipient_name: 'Test User',
      message_text: 'This is a test notification message',
      status: 'sent',
      telegram_message_id: '12345',
      related_entity_type: 'test',
      related_entity_id: '00000000-0000-0000-0000-000000000000',
      metadata: {
        test_type: 'success',
        timestamp: new Date().toISOString()
      }
    });

    // Test failed notification
    await logTelegramNotification(supabase, {
      function_name: 'test-telegram-monitoring',
      notification_type: 'test_failure',
      recipient_type: 'group',
      recipient_identifier: '-1001234567890',
      recipient_name: 'Test Group',
      message_text: 'This is a test failed notification',
      status: 'failed',
      error_details: {
        error_code: 400,
        description: 'Bad Request: test error'
      },
      related_entity_type: 'test',
      related_entity_id: '00000000-0000-0000-0000-000000000001',
      metadata: {
        test_type: 'failure',
        timestamp: new Date().toISOString()
      }
    });

    console.log('✅ Test notifications logged successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Test notifications logged successfully',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in test function:', error);
    
    return new Response(JSON.stringify({
      error: 'Test failed',
      details: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});