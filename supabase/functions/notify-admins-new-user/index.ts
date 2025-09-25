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

interface SellerStoreInfo {
  storeName?: string;
  storeLocation?: string;
  storeDescription?: string;
}

function formatUserMessage(userData: NewUserData, storeInfo?: SellerStoreInfo): string {
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

  // For sellers, include store details when available
  if (userData.userType === 'seller' && storeInfo) {
    if (storeInfo.storeName && String(storeInfo.storeName).trim().length > 0) {
      message += `🏬 Магазин: ${storeInfo.storeName}\n`;
    }
    if (storeInfo.storeLocation && String(storeInfo.storeLocation).trim().length > 0) {
      message += `📍 Локация: ${storeInfo.storeLocation}\n`;
    }
    if (storeInfo.storeDescription && String(storeInfo.storeDescription).trim().length > 0) {
      message += `📝 Описание: ${storeInfo.storeDescription}\n`;
    }
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

    return admins?.map((admin: any) => ({
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

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getSellerStoreInfo(supabase: any, userId: string): Promise<SellerStoreInfo> {
  try {
    // Read profile fields as fallback
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_name, location, description_user')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.warn('⚠️ Failed to fetch profile for store info (will use empty fallback):', profileError);
    }

    // Try to get a store record with short retries to avoid race conditions
    let store: any = null;
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const { data: storeRow, error: storeError } = await supabase
        .from('stores')
        .select('name, location, description')
        .eq('seller_id', userId)
        .limit(1)
        .maybeSingle();

      if (storeError) {
        console.warn(`⚠️ Attempt ${attempt}: fetch store error (will retry if attempts remain):`, storeError?.message || storeError);
      }

      if (storeRow && (storeRow.name || storeRow.location || storeRow.description)) {
        store = storeRow;
        break;
      }

      if (attempt < maxAttempts) {
        await delay(400);
      }
    }

    const storeInfo: SellerStoreInfo = {
      storeName: store?.name ?? profile?.company_name ?? undefined,
      storeLocation: store?.location ?? profile?.location ?? undefined,
      storeDescription: store?.description ?? profile?.description_user ?? undefined,
    };

    console.log('🧾 Resolved seller store info:', storeInfo);
    return storeInfo;
  } catch (err) {
    console.error('💥 Exception while building seller store info:', err);
    return {};
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

    // Atomic claim: set admin_new_user_notified_at only if currently NULL to prevent duplicates
    const claimTimestamp = new Date().toISOString();
    const { data: claimRows, error: claimError } = await supabase
      .from('profiles')
      .update({ admin_new_user_notified_at: claimTimestamp })
      .eq('id', userId)
      .is('admin_new_user_notified_at', null)
      .select('id');

    if (claimError) {
      console.warn('⚠️ Claim attempt failed:', claimError);
    }

    if (!claimRows || claimRows.length === 0) {
      console.log(`⏭️ Notification already claimed/processed for user ${userId}, skipping.`);
      return new Response(
        JSON.stringify({ success: true, message: 'Already processed for this user' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
    console.log(`👥 Admin Telegram recipients: ${adminTelegramIds.length}`);

    if (adminTelegramIds.length === 0) {
      console.warn('❌ No admin Telegram IDs found. Reverting claim to allow retry later.');
      await supabase
        .from('profiles')
        .update({ admin_new_user_notified_at: null })
        .eq('id', userId);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No admin Telegram IDs configured' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

let storeInfo: SellerStoreInfo | undefined = undefined;
if (userData.userType === 'seller') {
  storeInfo = await getSellerStoreInfo(supabase, userId);
}

const message = formatUserMessage(userData, storeInfo);
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
metadata: { userType, adminId: admin.id, storeName: storeInfo?.storeName, storeLocation: storeInfo?.storeLocation, storeDescription: storeInfo?.storeDescription }
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
          error_details: { error: error instanceof Error ? error.message : 'Unknown error' },
          metadata: { userType, adminId: admin.id, storeName: storeInfo?.storeName, storeLocation: storeInfo?.storeLocation, storeDescription: storeInfo?.storeDescription }
        });

        results.push({ adminId: admin.id, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    console.log(`✅ [AdminNewUserNotification] Sent ${successCount}/${totalCount} notifications for user ${userId}`);

    if (successCount === 0) {
      console.warn('↩️ No notifications were sent, reverting claim flag to NULL for user', userId);
      await supabase
        .from('profiles')
        .update({ admin_new_user_notified_at: null })
        .eq('id', userId);
    }

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
        error: (error instanceof Error ? error.message : 'Unknown error') || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});