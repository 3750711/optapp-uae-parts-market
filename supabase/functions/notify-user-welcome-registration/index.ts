
// Edge Function: notify-user-welcome-registration
// Sends a personal Telegram welcome message to users right after registration

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

// Helper to send Telegram message
async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data?.description || `Telegram API error: ${res.status}`);
  }
  return data;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!BOT_TOKEN || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error('Missing environment variables', { BOT_TOKEN: !!BOT_TOKEN, SUPABASE_URL: !!SUPABASE_URL, SERVICE_ROLE_KEY: !!SERVICE_ROLE_KEY });
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const userId = body?.userId as string | undefined;
    const force = Boolean(body?.force);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('🔔 [WelcomeRegistration] Processing user:', userId);

    // Fetch profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_type, full_name, telegram_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Failed to fetch profile:', profileError.message);
      return new Response(JSON.stringify({ error: 'Failed to fetch profile' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!profile) {
      console.warn('Profile not found for user:', userId);
      return new Response(JSON.stringify({ success: false, reason: 'profile_not_found' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Before sending, check if a welcome message was already sent to this user (by related_entity_id)
    if (!force) {
      try {
        const { data: existingSent, error: existingSentError } = await supabase
          .from('telegram_notifications_log')
          .select('id, function_name, telegram_message_id, created_at')
          .eq('notification_type', 'welcome_registration')
          .eq('related_entity_type', 'user')
          .eq('related_entity_id', profile.id)
          .eq('status', 'sent')
          .eq('function_name', 'notify-user-welcome-registration')
          .not('telegram_message_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingSentError) {
          console.error('Error checking existing welcome logs:', existingSentError.message);
        }
        if (existingSent) {
          console.log('Welcome message already sent, skipping. Log id:', existingSent.id, 'tg_msg_id:', existingSent.telegram_message_id);
          return new Response(JSON.stringify({ success: true, sent: false, reason: 'already_sent' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      } catch (e) {
        console.error('Exception during welcome dedupe check:', e);
        // Continue and attempt to send
      }
    }

    const isSeller = profile.user_type === 'seller';

    const messageText = isSeller
      ? 'Thank you for registering on partsbay.ae! We\'ll review your account shortly and you\'ll get access to the platform. Our administrator may contact you via Telegram if any details need clarification.'
      : 'Спасибо за регистрацию на partsbay.ae! Скоро мы проверим ваш аккаунт и вы получите доступ к платформе. Возможно, наш администратор свяжется с вами в Telegram, если потребуется уточнить информацию.';

    // If telegram_id is missing, log and exit gracefully
    if (!profile.telegram_id) {
      console.log('No telegram_id for user, skipping send and logging as pending');
      await supabase.from('telegram_notifications_log').insert({
        function_name: 'notify-user-welcome-registration',
        notification_type: 'welcome_registration',
        recipient_type: 'personal',
        recipient_identifier: profile.id,
        recipient_name: profile.full_name || null,
        message_text: messageText,
        status: 'pending',
        related_entity_type: 'user',
        related_entity_id: profile.id,
        metadata: { reason: 'no_telegram_id', user_type: profile.user_type }
      });

      return new Response(JSON.stringify({ success: true, sent: false, reason: 'no_telegram_id' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // === MIGRATED TO QSTASH ===
    console.log('📮 [Welcome] Publishing to QStash');
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    
    const { data: qstashSetting } = await adminSupabase
      .from('app_settings')
      .select('value')
      .eq('key', 'qstash_token')
      .maybeSingle();
    
    const QSTASH_TOKEN = qstashSetting?.value;
    
    if (!QSTASH_TOKEN) {
      throw new Error('QStash not configured');
    }
    
    const { data: endpointSetting } = await adminSupabase
      .from('app_settings')
      .select('value')
      .eq('key', 'qstash_endpoint_name')
      .maybeSingle();
    
    const endpointName = endpointSetting?.value || 'telegram-notification-queue';
    const qstashUrl = `https://qstash.upstash.io/v2/publish/${endpointName}`;
    
    let tgResult: any = null;
    try {
      const qstashResponse = await fetch(qstashUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${QSTASH_TOKEN}`,
          'Content-Type': 'application/json',
          'Upstash-Retries': '3',
          'Upstash-Deduplication-Id': `welcome-${userId}-${Date.now()}`,
          'Upstash-Forward-Queue': 'telegram-notification-queue'
        },
        body: JSON.stringify({
          notificationType: 'user_welcome',
          payload: { userId, force }
        })
      });
      
      if (!qstashResponse.ok) {
        throw new Error('QStash publish failed');
      }
      
      tgResult = await qstashResponse.json();
      console.log('✅ [Welcome] Queued via QStash:', tgResult.messageId);
    } catch (err) {
      console.error('❌ [Welcome] QStash failed:', err);
      // Log failure
      await supabase.from('telegram_notifications_log').insert({
        function_name: 'notify-user-welcome-registration',
        notification_type: 'welcome_registration',
        recipient_type: 'personal',
        recipient_identifier: String(profile.telegram_id),
        recipient_name: profile.full_name || null,
        message_text: messageText,
        status: 'failed',
        related_entity_type: 'user',
        related_entity_id: profile.id,
        error_details: String(err),
        metadata: { user_type: profile.user_type }
      });

      return new Response(JSON.stringify({ success: false, error: 'telegram_send_failed' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Log as queued
    await supabase.from('telegram_notifications_log').insert({
      function_name: 'notify-user-welcome-registration',
      notification_type: 'welcome_registration',
      recipient_type: 'personal',
      recipient_identifier: String(profile.telegram_id),
      recipient_name: profile.full_name || null,
      message_text: `Queued via QStash: ${userId}`,
      status: 'queued',
      related_entity_type: 'user',
      related_entity_id: profile.id,
      metadata: { 
        user_type: profile.user_type,
        qstash_message_id: tgResult?.messageId
      }
    });

    return new Response(JSON.stringify({ success: true, sent: true, qstashMessageId: tgResult?.messageId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('💥 [WelcomeRegistration] Unexpected error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
