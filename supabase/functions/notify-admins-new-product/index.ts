import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

console.log('Environment check:', {
  BOT_TOKEN_EXISTS: !!BOT_TOKEN,
  SUPABASE_URL_EXISTS: !!SUPABASE_URL,
  SERVICE_ROLE_KEY_EXISTS: !!SUPABASE_SERVICE_ROLE_KEY
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { productId } = await req.json();
    
    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'Product ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📢 [AdminNotification] Processing new product notification for: ${productId}`);

    // Get product details with images
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        product_images(url, is_primary)
      `)
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('❌ [AdminNotification] Failed to fetch product:', productError);
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get admin emails and their telegram IDs
    const adminEmails = ['efg22971@gmail.com', 'ts1@g.com', 'Mironenkonastya1997@mail.ru'];
    
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('email, telegram_id, full_name')
      .eq('user_type', 'admin')
      .in('email', adminEmails)
      .not('telegram_id', 'is', null);

    if (adminsError) {
      console.error('❌ [AdminNotification] Failed to fetch admins:', adminsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch admin profiles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!admins || admins.length === 0) {
      console.warn('⚠️ [AdminNotification] No admins with Telegram IDs found');
      return new Response(
        JSON.stringify({ message: 'No admins with Telegram IDs found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`👥 [AdminNotification] Found ${admins.length} admins to notify`);

    // Prepare message text
    const messageText = `🔥 У нас новый товар на проверке! Срочно проверьте его и опубликуйте

📦 Товар: ${product.title}
💰 Цена: ${product.price} AED
🚚 Доставка: ${product.delivery_price || 0} AED
👤 Продавец: ${product.seller_name}
🏷️ Бренд: ${product.brand}
🚗 Модель: ${product.model}
📍 Место: ${product.place_number}
📋 Описание: ${product.description || 'Не указано'}

🔗 Перейти к модерации: https://partsbay.ae/admin/product-moderation`;

    // Prepare images array
    const images = product.product_images?.map((img: any) => img.url) || [];

    // Send notifications to all admins
    const results = [];
    for (const admin of admins) {
      try {
        console.log(`📤 [AdminNotification] Sending to admin: ${admin.email} (${admin.full_name})`);
        
        const result = await sendTelegramMessage(admin.telegram_id, messageText, images);
        results.push({
          admin: admin.email,
          success: result.success,
          error: result.error
        });
        
        // Add delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ [AdminNotification] Failed to send to ${admin.email}:`, error);
        results.push({
          admin: admin.email,
          success: false,
          error: error.message
        });
      }
    }

    // Log the action
    await supabase
      .from('event_logs')
      .insert({
        action_type: 'admin_notification',
        entity_type: 'product',
        entity_id: productId,
        user_id: null,
        details: {
          type: 'new_product_pending',
          product_title: product.title,
          notified_admins: results.length,
          results: results
        }
      });

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ [AdminNotification] Sent ${successCount}/${results.length} notifications successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${successCount}/${results.length} notifications`,
        results: results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 [AdminNotification] Unexpected error:', error);
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

  const telegramAPI = `https://api.telegram.org/bot${BOT_TOKEN}`;

  try {
    if (images.length === 0) {
      // Send text-only message
      const response = await fetch(`${telegramAPI}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramId,
          text: messageText,
          parse_mode: 'HTML'
        })
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(`Telegram API error: ${result.description}`);
      }

      return { success: true, result };
    } else {
      // Send as media group with text
      const media = images.slice(0, 10).map((url, index) => ({
        type: 'photo',
        media: url,
        caption: index === 0 ? messageText : undefined,
        parse_mode: index === 0 ? 'HTML' : undefined
      }));

      const response = await fetch(`${telegramAPI}/sendMediaGroup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramId,
          media: media
        })
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(`Telegram API error: ${result.description}`);
      }

      return { success: true, result };
    }
  } catch (error) {
    console.error(`❌ [Telegram] Error sending message to ${telegramId}:`, error);
    return { success: false, error: error.message };
  }
}