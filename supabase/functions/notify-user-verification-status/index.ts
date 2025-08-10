
// Edge Function: notify-user-verification-status
// Sends personal Telegram messages to users when verification_status changes
// Adds site link for "verified" status

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false
    })
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data?.description || `Telegram API error: ${res.status}`);
  }
  return data;
}

Deno.serve(async (req) => {
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
    let status = body?.status as string | undefined;
    let userType = body?.userType as string | undefined;
    let fullName = body?.fullName as string | undefined;
    let telegramId = body?.telegramId as string | number | undefined;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('🔔 [VerificationStatus] Processing user:', userId, 'status:', status);

    // Fetch missing profile fields if needed
    if (!status || !userType || !fullName || !telegramId) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, verification_status, user_type, full_name, telegram_id')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch profile for verification notification:', error.message);
        return new Response(JSON.stringify({ error: 'Failed to fetch profile' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (!profile) {
        console.warn('Profile not found for user:', userId);
        return new Response(JSON.stringify({ success: false, reason: 'profile_not_found' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      status = status || profile.verification_status;
      userType = userType || profile.user_type;
      fullName = fullName || profile.full_name || undefined;
      telegramId = telegramId || profile.telegram_id || undefined;
    }

    // If no telegramId, log pending and stop
    if (!telegramId) {
      console.log('No telegram_id for user, logging as pending and skipping');
      await supabase.from('telegram_notifications_log').insert({
        function_name: 'notify-user-verification-status',
        notification_type: 'verification_status',
        recipient_type: 'personal',
        recipient_identifier: userId,
        recipient_name: fullName || null,
        message_text: null,
        status: 'pending',
        related_entity_type: 'user',
        related_entity_id: userId,
        metadata: { reason: 'no_telegram_id', user_type: userType, status }
      });
      return new Response(JSON.stringify({ success: true, sent: false, reason: 'no_telegram_id' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build message with site link for verified
    const siteUrl = 'https://partsbay.ae';
    const isSeller = userType === 'seller';
    let messageText: string;

    if (status === 'verified') {
      messageText = isSeller
        ? `Your account has been approved. You can now access the platform: ${siteUrl}`
        : `Ваш аккаунт одобрен. Теперь вы можете войти на сайт: ${siteUrl}`;
    } else if (status === 'pending') {
      messageText = isSeller
        ? 'Your account is under review. We will notify you once it is approved.'
        : 'Ваш аккаунт на модерации. Мы уведомим вас после проверки.';
    } else if (status === 'blocked') {
      messageText = isSeller
        ? 'Your account has been blocked. If you think this is a mistake, please contact support.'
        : 'Ваш аккаунт заблокирован. Если это ошибка — свяжитесь с поддержкой.';
    } else {
      messageText = isSeller
        ? `Your verification status has changed to: ${status}`
        : `Ваш статус верификации изменен на: ${status}`;
    }

    // Deduplication: check the last sent verification notification for THIS USER (not by telegramId)
    try {
      const { data: lastSent, error: lastErr } = await supabase
        .from('telegram_notifications_log')
        .select('id, created_at, telegram_message_id, metadata')
        .eq('notification_type', 'verification_status')
        .eq('status', 'sent')
        .eq('related_entity_type', 'user')
        .eq('related_entity_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastErr) {
        console.error('Error checking verification dedupe (last sent by user):', lastErr.message);
      } else if (lastSent) {
        const lastStatus = (lastSent as any)?.metadata?.status;
        const lastCreatedAt = (lastSent as any)?.created_at;
        const shouldSkip = lastStatus === status;
        console.log('[VerificationStatus][Dedupe] lastId:', lastSent.id, 'lastStatus:', lastStatus, 'lastCreatedAt:', lastCreatedAt, 'current:', status, 'decision:', shouldSkip ? 'skip' : 'send');
        if (shouldSkip) {
          return new Response(JSON.stringify({ success: true, sent: false, reason: 'already_sent_for_status' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
    } catch (e) {
      console.error('Exception during verification dedupe (last sent by user) check:', e);
    }

    // Send telegram message
    let tgResult: any = null;
    try {
      tgResult = await sendTelegramMessage(BOT_TOKEN, String(telegramId), messageText);
      console.log('Telegram verification message sent:', tgResult?.result?.message_id);
    } catch (err) {
      console.error('Telegram send failed (verification):', err);
      await supabase.from('telegram_notifications_log').insert({
        function_name: 'notify-user-verification-status',
        notification_type: 'verification_status',
        recipient_type: 'personal',
        recipient_identifier: String(telegramId),
        recipient_name: fullName || null,
        message_text: messageText,
        status: 'failed',
        related_entity_type: 'user',
        related_entity_id: userId,
        error_details: String(err),
        metadata: { user_type: userType, status }
      });

      return new Response(JSON.stringify({ success: false, error: 'telegram_send_failed' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Log success
    await supabase.from('telegram_notifications_log').insert({
      function_name: 'notify-user-verification-status',
      notification_type: 'verification_status',
      recipient_type: 'personal',
      recipient_identifier: String(telegramId),
      recipient_name: fullName || null,
      message_text: messageText,
      status: 'sent',
      telegram_message_id: tgResult?.result?.message_id || null,
      related_entity_type: 'user',
      related_entity_id: userId,
      metadata: { user_type: userType, status }
    });

    return new Response(JSON.stringify({ success: true, sent: true, messageId: tgResult?.result?.message_id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('💥 [VerificationStatus] Unexpected error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
