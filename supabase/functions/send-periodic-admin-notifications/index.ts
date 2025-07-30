import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

// Admin emails list
const ADMIN_EMAILS = ['efg22971@gmail.com', 'ts1@g.com', 'Mironenkonastya1997@mail.ru'];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 [PeriodicAdminNotifications] Starting periodic check for pending products...');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Find pending products that need admin notifications
    // Either never notified (admin_notification_sent_at IS NULL) or last notified more than 1 minute ago
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id, title, seller_id, created_at, admin_notification_sent_at,
        profiles!products_seller_id_fkey (
          full_name, opt_id, telegram
        ),
        product_images!inner (
          url, is_primary
        )
      `)
      .eq('status', 'pending')
      .or(`admin_notification_sent_at.is.null,admin_notification_sent_at.lt.${new Date(Date.now() - 60000).toISOString()}`)
      .order('created_at', { ascending: true })
      .limit(50); // Limit to prevent overwhelming admins

    if (productsError) {
      console.error('❌ [PeriodicAdminNotifications] Error fetching pending products:', productsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pending products' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!products || products.length === 0) {
      console.log('✅ [PeriodicAdminNotifications] No pending products found needing notifications');
      return new Response(
        JSON.stringify({ message: 'No pending products need notifications', count: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 [PeriodicAdminNotifications] Found ${products.length} pending products needing notifications`);

    let notificationsSent = 0;
    let errors = 0;

    // Get admin users with Telegram IDs
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('telegram_id, full_name, email')
      .eq('user_type', 'admin')
      .not('telegram_id', 'is', null);

    if (adminsError || !admins || admins.length === 0) {
      console.warn('⚠️ [PeriodicAdminNotifications] No admin users with Telegram IDs found');
      return new Response(
        JSON.stringify({ message: 'No admin users with Telegram IDs found', count: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`👥 [PeriodicAdminNotifications] Found ${admins.length} admin users with Telegram IDs`);

    // Process each pending product
    for (const product of products) {
      try {
        const seller = product.profiles;
        const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];
        
        // Determine how long the product has been pending
        const createdAt = new Date(product.created_at);
        const now = new Date();
        const hoursPending = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
        
        // Create message text
        const messageText = `🔔 НАПОМИНАНИЕ: Товар ожидает модерации (${hoursPending}ч)

📦 Товар: ${product.title}
👤 Продавец: ${seller?.full_name || 'Неизвестно'}
🆔 Продавец ID: ${seller?.opt_id || 'Не указан'}
📞 Telegram: ${seller?.telegram || 'Не указан'}
⏰ Создан: ${createdAt.toLocaleString('ru-RU')}

🔗 Ссылка: https://partsbay.ae/admin/products`;

        // Send to each admin
        for (const admin of admins) {
          try {
            if (primaryImage?.url) {
              await sendTelegramMessage(admin.telegram_id, messageText, [primaryImage.url]);
            } else {
              await sendTelegramMessage(admin.telegram_id, messageText);
            }
            console.log(`✅ [PeriodicAdminNotifications] Sent notification to admin ${admin.full_name} for product ${product.id}`);
          } catch (telegramError) {
            console.error(`❌ [PeriodicAdminNotifications] Failed to send to admin ${admin.full_name}:`, telegramError);
            errors++;
          }
        }

        // Update admin_notification_sent_at timestamp
        const { error: updateError } = await supabase
          .from('products')
          .update({ admin_notification_sent_at: new Date().toISOString() })
          .eq('id', product.id);

        if (updateError) {
          console.error(`❌ [PeriodicAdminNotifications] Failed to update notification timestamp for product ${product.id}:`, updateError);
          errors++;
        } else {
          notificationsSent++;
        }

        // Log notification event
        await supabase
          .from('event_logs')
          .insert({
            action_type: 'periodic_admin_notification',
            entity_type: 'product',
            entity_id: product.id,
            user_id: product.seller_id,
            details: {
              product_title: product.title,
              seller_name: seller?.full_name,
              hours_pending: hoursPending,
              admin_count: admins.length
            }
          });

      } catch (productError) {
        console.error(`❌ [PeriodicAdminNotifications] Error processing product ${product.id}:`, productError);
        errors++;
      }
    }

    const result = {
      message: 'Periodic admin notifications completed',
      products_processed: products.length,
      notifications_sent: notificationsSent,
      errors: errors,
      admins_notified: admins.length
    };

    console.log(`✅ [PeriodicAdminNotifications] Completed: ${JSON.stringify(result)}`);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 [PeriodicAdminNotifications] Critical error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendTelegramMessage(telegramId: number, messageText: string, images: string[] = []) {
  if (!BOT_TOKEN) {
    throw new Error('Telegram bot token not configured');
  }

  const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}`;

  try {
    if (images && images.length > 0) {
      // Send message with image
      const response = await fetch(`${telegramApiUrl}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramId,
          photo: images[0],
          caption: messageText,
          parse_mode: 'HTML'
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Telegram API error: ${response.status} - ${errorData}`);
      }
    } else {
      // Send text-only message
      const response = await fetch(`${telegramApiUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramId,
          text: messageText,
          parse_mode: 'HTML'
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Telegram API error: ${response.status} - ${errorData}`);
      }
    }
  } catch (error) {
    console.error(`Failed to send Telegram message to ${telegramId}:`, error);
    throw error;
  }
}