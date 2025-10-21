import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logTelegramNotification } from "../shared/telegram-logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

console.log('=== Notify Seller New Price Offer Function Started ===');
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
      offerId, 
      productId, 
      sellerId, 
      buyerId, 
      offeredPrice, 
      originalPrice, 
      message, 
      expiresAt,
      notificationType = 'new_offer',
      oldPrice 
    } = await req.json();

    console.log('Processing price offer notification:', {
      offerId,
      productId,
      sellerId,
      buyerId,
      offeredPrice,
      originalPrice,
      notificationType,
      oldPrice
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

    // Get buyer's profile info
    const { data: buyer, error: buyerError } = await supabase
      .from('profiles')
      .select('full_name, opt_id')
      .eq('id', buyerId)
      .single();

    if (buyerError || !buyer) {
      console.error('Buyer not found:', buyerError?.message);
      return new Response(
        JSON.stringify({ error: 'Buyer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get product info with images
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        title, brand, model, description, cloudinary_url,
        product_images(url, is_primary)
      `)
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Product not found:', productError?.message);
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine language and date format based on user_type
    const isEnglish = seller.user_type === 'seller';
    const locale = isEnglish ? 'en-US' : 'ru-RU';
    const expirationDate = new Date(expiresAt).toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Get product image
    const primaryImage = product.product_images?.find(img => img.is_primary);
    const productImage = primaryImage?.url || product.product_images?.[0]?.url || product.cloudinary_url;

    // Apply Cloudinary optimization if available
    const optimizedImageUrl = productImage?.includes('cloudinary.com') 
      ? productImage.replace('/upload/', '/upload/q_auto:good,f_auto,c_limit,w_800,h_800/')
      : productImage;

    // Create localized message based on notification type
    let telegramMessage;
    
    if (notificationType === 'price_update') {
      // Price update messages
      telegramMessage = isEnglish ? `
📝 <b>Price Offer Updated!</b>

🏷️ <b>Product:</b> ${product.title}${product.brand ? ` (${product.brand}` : ''}${product.model ? ` ${product.model})` : product.brand ? ')' : ''}

💰 <b>Original Price:</b> $${originalPrice}
📉 <b>Previous Offer:</b> $${oldPrice}
🎯 <b>New Offer:</b> $${offeredPrice}

👤 <b>From Buyer:</b> ${buyer.full_name} (ID: ${buyer.opt_id})

${message ? `💬 <b>Message:</b> ${message}\n` : ''}⏰ <b>Valid Until:</b> ${expirationDate}

🔗 <b>Link:</b> https://partsbay.ae/product/${productId}

Buyer updated their offer. You can respond in your account dashboard.
      `.trim() : `
📝 <b>Предложение цены обновлено!</b>

🏷️ <b>Товар:</b> ${product.title}${product.brand ? ` (${product.brand}` : ''}${product.model ? ` ${product.model})` : product.brand ? ')' : ''}

💰 <b>Первоначальная цена:</b> ${originalPrice.toLocaleString('ru-RU')}₽
📉 <b>Предыдущее предложение:</b> ${oldPrice.toLocaleString('ru-RU')}₽
🎯 <b>Новое предложение:</b> ${offeredPrice.toLocaleString('ru-RU')}₽

👤 <b>От покупателя:</b> ${buyer.full_name} (ID: ${buyer.opt_id})

${message ? `💬 <b>Сообщение:</b> ${message}\n` : ''}⏰ <b>Действительно до:</b> ${expirationDate}

🔗 <b>Ссылка:</b> https://partsbay.ae/product/${productId}

Покупатель изменил своё предложение. Ответить можно в личном кабинете на сайте.
      `.trim();
    } else {
      // New offer messages (existing logic)
      telegramMessage = isEnglish ? `
📦 <b>New Price Offer!</b>

🏷️ <b>Product:</b> ${product.title}${product.brand ? ` (${product.brand}` : ''}${product.model ? ` ${product.model})` : product.brand ? ')' : ''}

💰 <b>Original Price:</b> $${originalPrice}
🎯 <b>Offered Price:</b> $${offeredPrice}

👤 <b>From Buyer:</b> ${buyer.full_name} (ID: ${buyer.opt_id})

${message ? `💬 <b>Message:</b> ${message}\n` : ''}⏰ <b>Valid Until:</b> ${expirationDate}

🔗 <b>Link:</b> https://partsbay.ae/product/${productId}

You can respond to this offer in your account dashboard.
      `.trim() : `
📦 <b>Новое предложение цены!</b>

🏷️ <b>Товар:</b> ${product.title}${product.brand ? ` (${product.brand}` : ''}${product.model ? ` ${product.model})` : product.brand ? ')' : ''}

💰 <b>Первоначальная цена:</b> ${originalPrice.toLocaleString('ru-RU')}₽
🎯 <b>Предложенная цена:</b> ${offeredPrice.toLocaleString('ru-RU')}₽

👤 <b>От покупателя:</b> ${buyer.full_name} (ID: ${buyer.opt_id})

${message ? `💬 <b>Сообщение:</b> ${message}\n` : ''}⏰ <b>Действительно до:</b> ${expirationDate}

🔗 <b>Ссылка:</b> https://partsbay.ae/product/${productId}

Ответить на предложение можно в личном кабинете на сайте.
      `.trim();
    }

    // === MIGRATED TO QSTASH ===
    console.log('📮 [PriceOffer] Publishing to QStash queue');
    
    const { getQStashConfig, publishToQueue, generateDeduplicationId } = await import('../_shared/qstash-config.ts');
    
    const qstashConfig = await getQStashConfig();
    const deduplicationId = generateDeduplicationId('price-offer', offerId);
    
    let result;
    try {
      result = await publishToQueue(
        qstashConfig,
        'price_offer',
        {
          offerId,
          productId,
          sellerId,
          buyerId,
          offeredPrice,
          originalPrice,
          message,
          expiresAt,
          notificationType,
          oldPrice
        },
        deduplicationId
      );
      
      console.log('✅ [PriceOffer] Queued via QStash:', result.messageId);
    } catch (error) {
      console.error('❌ [PriceOffer] QStash failed:', error);
      
      // QStash failed
      await logTelegramNotification(supabase, {
        function_name: 'notify-seller-new-price-offer',
        notification_type: notificationType === 'price_update' ? 'price_offer_update' : 'price_offer_new',
        recipient_type: 'personal',
        recipient_identifier: seller.telegram_id.toString(),
        recipient_name: seller.full_name,
        message_text: `QStash failed for offer ${offerId}`,
        status: 'failed',
        related_entity_type: 'price_offer',
        related_entity_id: offerId,
        error_details: { qstash_error: error.message },
        metadata: {
          product_id: productId,
          offered_price: offeredPrice,
          original_price: originalPrice,
          old_price: oldPrice,
          buyer_name: buyer.full_name
        }
      });
      
      throw error;
    }

    // Log as queued
    await logTelegramNotification(supabase, {
      function_name: 'notify-seller-new-price-offer',
      notification_type: notificationType === 'price_update' ? 'price_offer_update' : 'price_offer_new',
      recipient_type: 'personal',
      recipient_identifier: seller.telegram_id.toString(),
      recipient_name: seller.full_name,
      message_text: `Queued via QStash: ${offerId}`,
      status: 'queued',
      related_entity_type: 'price_offer',
      related_entity_id: offerId,
      metadata: {
        product_id: productId,
        offered_price: offeredPrice,
        original_price: originalPrice,
        old_price: oldPrice,
        buyer_name: buyer.full_name,
        qstash_message_id: result.messageId
      }
    });

    // Log the action for backward compatibility
    try {
      await supabase
        .from('event_logs')
        .insert({
          action_type: notificationType === 'price_update' ? 'price_offer_update_telegram_notification' : 'price_offer_telegram_notification',
          entity_type: 'price_offer',
          entity_id: offerId,
          user_id: sellerId,
          details: {
            seller_name: seller.full_name,
            buyer_name: buyer.full_name,
            product_title: product.title,
            offered_price: offeredPrice,
            original_price: originalPrice,
            old_price: oldPrice,
            notification_type: notificationType,
            qstash_message_id: result.messageId
          }
        });
      console.log('Action logged successfully');
    } catch (logError) {
      console.error('Failed to log action:', logError);
      // Don't throw here, notification was sent successfully
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification queued via QStash',
        qstash_message_id: result.messageId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-seller-new-price-offer function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});