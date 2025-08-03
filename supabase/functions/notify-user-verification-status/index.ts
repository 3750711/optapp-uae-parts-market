import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";
import { logTelegramNotification } from "../shared/telegram-logger.ts";

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

console.log('User Verification Notification Environment:', {
  BOT_TOKEN_EXISTS: !!BOT_TOKEN,
  SUPABASE_URL_EXISTS: !!SUPABASE_URL,
  SERVICE_ROLE_KEY_EXISTS: !!SUPABASE_SERVICE_ROLE_KEY
});

interface UserVerificationData {
  userId: string;
  status: 'verified' | 'blocked' | 'pending';
  userType: 'buyer' | 'seller';
  fullName: string;
  telegramId?: string;
}

function getStatusMessage(status: string, userType: string, fullName: string) {
  const isRussian = userType === 'buyer';
  
  switch (status) {
    case 'verified':
      return isRussian 
        ? `✅ Поздравляем, ${fullName}!\n\nВаш аккаунт успешно верифицирован. Теперь у вас есть полный доступ к платформе PartsBay.`
        : `✅ Congratulations, ${fullName}!\n\nYour account has been successfully verified. You now have full access to the PartsBay platform.`;
    
    case 'blocked':
      return isRussian
        ? `❌ Уважаемый ${fullName},\n\nВаш аккаунт был заблокирован. Для получения дополнительной информации, пожалуйста, обратитесь в службу поддержки.`
        : `❌ Dear ${fullName},\n\nYour account has been blocked. Please contact our support team for more information.`;
    
    case 'pending':
      return isRussian
        ? `⏳ Уважаемый ${fullName},\n\nВаш аккаунт находится на повторном рассмотрении. Мы уведомим вас о результате как можно скорее.`
        : `⏳ Dear ${fullName},\n\nYour account is under review. We will notify you of the result as soon as possible.`;
    
    default:
      return isRussian
        ? `Статус вашего аккаунта изменен: ${status}`
        : `Your account status has been updated: ${status}`;
  }
}

async function sendUserNotification(userData: UserVerificationData) {
  if (!BOT_TOKEN) {
    throw new Error('Telegram bot token not configured');
  }

  if (!userData.telegramId) {
    console.log(`No Telegram ID for user ${userData.userId}, skipping notification`);
    return { success: false, reason: 'No Telegram ID' };
  }

  const message = getStatusMessage(userData.status, userData.userType, userData.fullName);
  const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: userData.telegramId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Telegram API error: ${result.description || 'Unknown error'}`);
    }

    console.log(`✅ User notification sent successfully to ${userData.telegramId}`);
    return { success: true, telegramResponse: result };

  } catch (error) {
    console.error(`❌ Failed to send user notification:`, error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📢 [UserVerificationNotification] Function called');
    
    const { userId, status, userType, fullName, telegramId }: UserVerificationData = await req.json();
    
    if (!userId || !status) {
      throw new Error('Missing required parameters: userId and status');
    }

    console.log(`📢 [UserVerificationNotification] Processing: user=${userId}, status=${status}, type=${userType}`);

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const userData: UserVerificationData = {
      userId,
      status,
      userType,
      fullName: fullName || 'Пользователь',
      telegramId
    };

    // Send notification to user
    const result = await sendUserNotification(userData);

    // Log the notification
    await logTelegramNotification(supabase, {
      function_name: 'notify-user-verification-status',
      notification_type: 'verification_status_change',
      recipient_type: 'personal',
      recipient_identifier: telegramId || userId,
      recipient_name: fullName,
      message_text: getStatusMessage(status, userType, fullName),
      status: result.success ? 'sent' : 'failed',
      telegram_message_id: result.success ? result.telegramResponse?.result?.message_id?.toString() : undefined,
      related_entity_type: 'user',
      related_entity_id: userId,
      error_details: result.success ? undefined : result,
      metadata: { status, userType }
    });

    console.log(`✅ [UserVerificationNotification] Successfully processed notification for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User notification sent successfully',
        notificationSent: result.success
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ [UserVerificationNotification] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});