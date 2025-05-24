
// ======================== IMPORTANT NOTICE ========================
// This file contains critical notification functionality.
// DO NOT EDIT unless absolutely necessary!
// 
// Any changes may affect the product notification system that sends
// messages to Telegram. This system is currently working properly.
// 
// Version: 1.1.0
// Last Verified Working: 2025-05-24
// Change: Added brand and model to product notifications
// ================================================================

// Handler for product notifications

import { BOT_TOKEN, MIN_IMAGES_REQUIRED, PRODUCT_GROUP_CHAT_ID } from "./config.ts";
import { sendImageMediaGroups } from "./telegram-api.ts";

/**
 * Handles product status change notifications
 * IMPORTANT: This function is critical for business operations
 * and has been thoroughly tested. Modify with extreme caution.
 */
export async function handleProductNotification(productId: string, notificationType: string | null, supabaseClient: any, corsHeaders: Record<string, string>) {
  // Validate required parameters
  if (!productId) {
    console.log('Missing required parameter: productId');
    return new Response(
      JSON.stringify({ error: 'Missing required parameter: productId' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }

  const productNotificationType = notificationType || 'status_change';
  console.log(`Processing ${productNotificationType} notification request for ID:`, productId);
  
  // Fetch complete product details including images and videos
  const { data: product, error } = await supabaseClient
    .from('products')
    .select(`
      *,
      product_images(*),
      product_videos(*)
    `)
    .eq('id', productId)
    .maybeSingle();

  if (error || !product) {
    console.log('Error fetching product:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Product not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    );
  }

  console.log('Successfully fetched product:', product.title, 'status:', product.status);
  
  // Check if there are any images for this product
  const images = product.product_images || [];
  const videos = product.product_videos || [];
  
  console.log('Product has', images.length, 'images and', videos.length, 'videos');
  
  // Don't send notification if there are not enough images (except for sold notifications)
  if (notificationType !== 'sold' && images.length < MIN_IMAGES_REQUIRED) {
    console.log(`Not enough images found for product (${images.length}/${MIN_IMAGES_REQUIRED}), skipping notification`);
    
    // Reset the notification timestamp to allow another attempt later
    const { error: updateError } = await supabaseClient
      .from('products')
      .update({ last_notification_sent_at: null })
      .eq('id', productId);
    
    if (updateError) {
      console.log('Error resetting notification timestamp:', updateError);
    } else {
      console.log('Successfully reset notification timestamp to allow retry later');
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Notification skipped - not enough images found (${images.length}/${MIN_IMAGES_REQUIRED})` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
  
  // Helper function to format brand and model
  const formatBrandModel = (brand: string | null, model: string | null): string => {
    const brandText = brand || '';
    const modelText = model || '';
    
    if (brandText && modelText) {
      return ` ${brandText} ${modelText}`;
    } else if (brandText) {
      return ` ${brandText}`;
    } else if (modelText) {
      return ` ${modelText}`;
    }
    return '';
  };

  // Prepare the notification message based on notification type
  let messageText = "";

  if (notificationType === 'sold') {
    // Create specialized message for sold products with brand and model
    const brandModelText = formatBrandModel(product.brand, product.model);
    messageText = [
      `😔 Жаль, но Лот #${product.lot_number} ${product.title}${brandModelText} уже ушел!`,
      `Кто-то оказался быстрее... в следующий раз повезет - будь начеку.`
    ].join('\n');
  } else {
    // Standard notification for status changes or new products with brand and model
    const brandModelText = formatBrandModel(product.brand, product.model);
    
    const messageData = {
      title: product.title,
      brandModel: brandModelText,
      price: product.price,
      deliveryPrice: product.delivery_price,
      lotNumber: product.lot_number,
      optId: product.optid_created || '',
      telegram: product.telegram_url || '',
      status: product.status
    };
    
    messageText = [
      `LOT(лот) #${messageData.lotNumber}`,
      `📦 ${messageData.title}${messageData.brandModel}`,
      `💰 Цена: ${messageData.price} $`,
      `🚚 Цена доставки: ${messageData.deliveryPrice} $`,
      `🆔 OPT_ID продавца: ${messageData.optId}`,
      `👤 Telegram продавца: @${messageData.telegram}`,
      '',
      `📊 Статус: ${messageData.status === 'active' ? 'Опубликован' : 
             messageData.status === 'sold' ? 'Продан' : 'На модерации'}`
    ].join('\n');
  }
  
  console.log('Sending message to Telegram:', messageText);
  
  // For sold notifications, we only need to send text message without images
  if (notificationType === 'sold') {
    try {
      const textMessageResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: PRODUCT_GROUP_CHAT_ID,
          text: messageText,
          parse_mode: 'HTML'
        }),
      });
      
      const textResult = await textMessageResponse.json();
      
      if (!textResult.ok) {
        console.error('Error sending sold notification message:', textResult.description);
        throw new Error(textResult.description || 'Failed to send sold notification');
      }
      
      console.log('Sold notification sent successfully');
      
      // Update the notification timestamp
      const { error: updateError } = await supabaseClient
        .from('products')
        .update({ last_notification_sent_at: new Date().toISOString() })
        .eq('id', productId);
        
      if (updateError) {
        console.error('Error updating notification timestamp:', updateError);
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Sold notification sent successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error sending sold notification:', error);
      return new Response(
        JSON.stringify({ success: false, message: `Failed to send sold notification: ${error.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  }

  // For regular product notifications, continue with image processing and send to PRODUCT_GROUP_CHAT_ID
  return await sendImageMediaGroups(
    images.map((image: any) => image.url), 
    messageText, 
    supabaseClient, 
    productId,
    PRODUCT_GROUP_CHAT_ID,
    corsHeaders,
    BOT_TOKEN
  );
}
