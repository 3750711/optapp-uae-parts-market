import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      expiresAt 
    } = await req.json();

    console.log('Processing price offer notification:', {
      offerId,
      productId,
      sellerId,
      buyerId,
      offeredPrice,
      originalPrice
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

    // Create localized message
    const telegramMessage = isEnglish ? `
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

    console.log(`Telegram notification sent successfully to seller ${seller.full_name}`);

    // Log the action
    try {
      await supabase
        .from('event_logs')
        .insert({
          action_type: 'price_offer_telegram_notification',
          entity_type: 'price_offer',
          entity_id: offerId,
          user_id: sellerId,
          details: {
            seller_name: seller.full_name,
            buyer_name: buyer.full_name,
            product_title: product.title,
            offered_price: offeredPrice,
            original_price: originalPrice,
            telegram_message_id: telegramResult.result?.message_id
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
        message: 'Notification sent successfully',
        telegram_result: telegramResult.result
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