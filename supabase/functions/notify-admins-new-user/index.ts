import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "./config.ts";
import { verifyAuthentication } from "./auth-utils.ts";
import { logTelegramNotification } from "../shared/telegram-logger.ts";

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

console.log('Admin New User Notification Environment:', {
  BOT_TOKEN_EXISTS: !!BOT_TOKEN
});

interface NewUserData {
  userId: string;
  fullName: string;
  email: string;
  userType: 'buyer' | 'seller';
  phone?: string;
  optId?: string;
  telegram?: string;
  createdAt: string;
}

function formatUserMessage(userData: NewUserData): string {
  const userTypeRu = userData.userType === 'buyer' ? 'Покупатель' : 'Продавец';
  const userTypeIcon = userData.userType === 'buyer' ? '🛒' : '🏪';
  
  let message = `${userTypeIcon} Новый пользователь на рассмотрении\n\n`;
  message += `👤 Имя: ${userData.fullName}\n`;
  message += `📧 Email: ${userData.email}\n`;
  message += `👥 Тип: ${userTypeRu}\n`;
  
  if (userData.phone) {
    message += `📱 Телефон: ${userData.phone}\n`;
  }
  
  if (userData.optId) {
    message += `🆔 OPT ID: ${userData.optId}\n`;
  }
  
  if (userData.telegram) {
    message += `📱 Telegram: @${userData.telegram}\n`;
  }
  
  message += `📅 Дата регистрации: ${new Date(userData.createdAt).toLocaleString('ru-RU')}\n\n`;
  message += `🔗 Проверить пользователя: https://partsbay.ae/admin/users\n`;
  message += `ID: ${userData.userId}`;
  
  return message;
}

async function getAdminTelegramIds(supabase: any): Promise<Array<{id: string, name: string, telegramId: string}>> {
  try {
    const { data: admins, error } = await supabase
      .from('profiles')
      .select('id, full_name, telegram_id')
      .eq('user_type', 'admin')
      .not('telegram_id', 'is', null);

    if (error) {
      console.error('Error fetching admin telegram IDs:', error);
      return [];
    }

    return admins?.map(admin => ({
      id: admin.id,
      name: admin.full_name || 'Admin',
      telegramId: admin.telegram_id.toString()
    })) || [];
  } catch (error) {
    console.error('Exception fetching admin telegram IDs:', error);
    return [];
  }
}

async function sendAdminNotification(adminTelegramId: string, message: string): Promise<any> {
  if (!BOT_TOKEN) {
    throw new Error('Telegram bot token not configured');
  }

  const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: adminTelegramId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Telegram API error: ${result.description || 'Unknown error'}`);
    }

    return result;
  } catch (error) {
    console.error(`Failed to send admin notification to ${adminTelegramId}:`, error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📢 [AdminNewUserNotification] Function called');

    const { userId, fullName, email, userType, phone, optId, telegram, createdAt }: NewUserData = await req.json();
    
    if (!userId || !email || !userType) {
      throw new Error('Missing required parameters: userId, email, and userType');
    }

    console.log(`📢 [AdminNewUserNotification] Processing new user: ${email} (${userType})`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Safety guard: skip if already notified
    try {
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('admin_new_user_notified_at')
        .eq('id', userId)
        .single();
      if (profileErr) {
        console.warn('⚠️ Failed to fetch profile for deduplication check:', profileErr);
      }
      if (profile && profile.admin_new_user_notified_at) {
        console.log(`⏭️ Already notified admins for user ${userId}, skipping.`);
        return new Response(
          JSON.stringify({ success: true, message: 'Already notified admins for this user' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (guardErr) {
      console.warn('⚠️ Deduplication guard encountered an error, proceeding anyway:', guardErr);
    }

    const userData: NewUserData = {
      userId,
      fullName: fullName || 'Неизвестно',
      email,
      userType,
      phone,
      optId,
      telegram,
      createdAt: createdAt || new Date().toISOString()
    };

    // Get admin Telegram IDs
    const adminTelegramIds = await getAdminTelegramIds(supabase);
    
    if (adminTelegramIds.length === 0) {
      console.warn('❌ No admin Telegram IDs found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No admin Telegram IDs configured' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const message = formatUserMessage(userData);
    const results = [];

    // Send notifications to all admins
    for (const admin of adminTelegramIds) {
      try {
        console.log(`📤 Sending notification to admin: ${admin.name} (${admin.telegramId})`);
        const result = await sendAdminNotification(admin.telegramId, message);
        
        // Log successful notification
        await logTelegramNotification(supabase, {
          function_name: 'notify-admins-new-user',
          notification_type: 'new_user_pending',
          recipient_type: 'personal',
          recipient_identifier: admin.telegramId,
          recipient_name: admin.name,
          message_text: message,
          status: 'sent',
          telegram_message_id: result.result?.message_id?.toString(),
          related_entity_type: 'user',
          related_entity_id: userId,
          metadata: { userType, adminId: admin.id }
        });

        results.push({ adminId: admin.id, success: true });
        console.log(`✅ Notification sent successfully to admin: ${admin.name}`);
        
      } catch (error) {
        console.error(`❌ Failed to send notification to admin ${admin.name}:`, error);
        
        // Log failed notification
        await logTelegramNotification(supabase, {
          function_name: 'notify-admins-new-user',
          notification_type: 'new_user_pending',
          recipient_type: 'personal',
          recipient_identifier: admin.telegramId,
          recipient_name: admin.name,
          message_text: message,
          status: 'failed',
          related_entity_type: 'user',
          related_entity_id: userId,
          error_details: { error: error.message },
          metadata: { userType, adminId: admin.id }
        });

        results.push({ adminId: admin.id, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    console.log(`✅ [AdminNewUserNotification] Sent ${successCount}/${totalCount} notifications for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${successCount}/${totalCount} admin notifications`,
        results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ [AdminNewUserNotification] Error:', error);
    
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