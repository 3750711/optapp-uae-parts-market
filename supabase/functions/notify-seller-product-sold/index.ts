import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logTelegramNotification } from '../shared/telegram-logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

console.log('=== Notify Seller Product Sold Function Started ===');
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
    
    const { 
      orderId, 
      sellerId, 
      orderNumber, 
      buyerOptId, 
      productId,
      title,
      price,
      brand,
      model,
      images
    } = await req.json();

    console.log('Processing product sold notification:', {
      orderId,
      sellerId,
      orderNumber,
      buyerOptId,
      productId,
      title,
      price,
      brand,
      model,
      imagesCount: images?.length || 0
    });

    if (!BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    // Get seller's telegram_id, profile info, and user_type for language detection
    const { data: seller, error: sellerError } = await supabase
      .from('profiles')
      .select('telegram_id, full_name, email, user_type')
      .eq('id', sellerId)
      .single();

    if (sellerError || !seller) {
      console.error('Seller not found:', sellerError?.message);
      return new Response(
        JSON.stringify({ error: 'Seller not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!seller.telegram_id) {
      console.log('Seller has no Telegram ID, skipping notification');
      return new Response(
        JSON.stringify({ message: 'Seller has no Telegram ID' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine language based on user_type
    const isEnglish = seller.user_type === 'seller';
    const locale = isEnglish ? 'en-US' : 'ru-RU';
    const saleDate = new Date().toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Get the first image from order images
    const orderImage = images && images.length > 0 ? images[0] : null;

    // Apply Cloudinary optimization if available
    const optimizedImageUrl = orderImage?.includes('cloudinary.com') 
      ? orderImage.replace('/upload/', '/upload/q_auto:good,f_auto,c_limit,w_800,h_800/')
      : orderImage;

    // Create localized message
    const telegramMessage = isEnglish ? `
🎉 <b>Your product sold!</b>

🏷️ <b>Product:</b> ${title}${brand ? ` (${brand}` : ''}${model ? ` ${model})` : brand ? ')' : ''}

💰 <b>Sale Price:</b> $${price}
📋 <b>Order #:</b> ${orderNumber}
👤 <b>Buyer ID:</b> ${buyerOptId}

📅 <b>Sale Date:</b> ${saleDate}

🔗 <b>Order Link:</b> https://partsbay.ae/order/${orderId}

Congratulations on your sale! You can view order details in your dashboard.
    `.trim() : `
🎉 <b>Ваш товар продан!</b>

🏷️ <b>Товар:</b> ${title}${brand ? ` (${brand}` : ''}${model ? ` ${model})` : brand ? ')' : ''}

💰 <b>Цена продажи:</b> ${price?.toLocaleString('ru-RU')}₽
📋 <b>Заказ №:</b> ${orderNumber}
👤 <b>ID покупателя:</b> ${buyerOptId}

📅 <b>Дата продажи:</b> ${saleDate}

🔗 <b>Ссылка на заказ:</b> https://partsbay.ae/order/${orderId}

Поздравляем с продажей! Детали заказа можно посмотреть в личном кабинете.
    `.trim();

    // Send Telegram notification (with photo if available)
    let telegramResponse;
    if (optimizedImageUrl) {
      // Send photo with caption
      telegramResponse = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: seller.telegram_id,
            photo: optimizedImageUrl,
            caption: telegramMessage,
            parse_mode: 'HTML'
          })
        }
      );
    } else {
      // Fallback to text message
      telegramResponse = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: seller.telegram_id,
            text: telegramMessage,
            parse_mode: 'HTML',
            disable_web_page_preview: true
          })
        }
      );
    }

    const telegramResult = await telegramResponse.json();

    if (!telegramResponse.ok) {
      console.error('Telegram API error:', telegramResult);
      throw new Error(`Failed to send Telegram message: ${telegramResult.description}`);
    }

    console.log(`Product sold notification sent successfully to seller ${seller.full_name}`);

    // Log to telegram notifications tracking
    try {
      await logTelegramNotification(supabase, {
        function_name: 'notify-seller-product-sold',
        notification_type: 'product_sold',
        recipient_type: 'personal',
        recipient_identifier: seller.telegram_id.toString(),
        recipient_name: seller.full_name,
        message_text: telegramMessage,
        status: 'sent',
        telegram_message_id: telegramResult.result?.message_id?.toString(),
        related_entity_type: 'order',
        related_entity_id: orderId,
        metadata: {
          order_number: orderNumber,
          product_title: title,
          sale_price: price,
          product_id: productId,
          buyer_opt_id: buyerOptId
        }
      });
    } catch (logError) {
      console.error('Failed to log telegram notification:', logError);
    }

    // Log the action
    try {
      await supabase
        .from('event_logs')
        .insert({
          action_type: 'product_sold_telegram_notification',
          entity_type: 'order',
          entity_id: orderId,
          user_id: sellerId,
          details: {
            seller_name: seller.full_name,
            buyer_opt_id: buyerOptId,
            order_number: orderNumber,
            product_title: title,
            sale_price: price,
            product_id: productId,
            telegram_message_id: telegramResult.result?.message_id
          }
        });
      console.log('Product sold notification logged successfully');
    } catch (logError) {
      console.error('Failed to log product sold notification:', logError);
      // Don't throw here, notification was sent successfully
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Product sold notification sent successfully',
        telegram_result: telegramResult.result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-seller-product-sold function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});