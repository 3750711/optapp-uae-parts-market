import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    
    if (!BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    // Get the webhook URL using functions_url helper
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: settingsData, error: settingsError } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'functions_base_url')
      .single();

    if (settingsError || !settingsData?.value) {
      throw new Error('functions_base_url not found in app_settings');
    }

    const baseUrl = settingsData.value.replace(/\/$/, '');
    const webhookUrl = `${baseUrl}/functions/v1/telegram-webhook`;
    
    console.log('Setting up Telegram webhook:', webhookUrl);

    const { action = 'set' } = await req.json().catch(() => ({ action: 'set' }));

    if (action === 'info') {
      // Get webhook info
      const infoResponse = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
      );
      const infoData = await infoResponse.json();
      
      return new Response(
        JSON.stringify({
          success: true,
          webhookInfo: infoData.result
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      // Delete webhook
      const deleteResponse = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`
      );
      const deleteData = await deleteResponse.json();
      
      return new Response(
        JSON.stringify({
          success: deleteData.ok,
          message: 'Webhook deleted',
          data: deleteData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Set webhook
    const setWebhookResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'channel_post'],
          drop_pending_updates: false
        })
      }
    );

    const setWebhookData = await setWebhookResponse.json();

    if (!setWebhookData.ok) {
      throw new Error(`Failed to set webhook: ${setWebhookData.description}`);
    }

    // Verify webhook was set correctly
    const verifyResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
    );
    const verifyData = await verifyResponse.json();

    console.log('Webhook setup complete:', verifyData.result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook successfully configured',
        webhookUrl,
        webhookInfo: verifyData.result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error setting up webhook:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
