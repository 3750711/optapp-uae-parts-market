
// ======================== IMPORTANT NOTICE ========================
// This file contains critical notification functionality.
// DO NOT EDIT unless absolutely necessary!
// 
// Any changes may affect the product notification system that sends
// messages to Telegram. This system is currently working properly.
// 
// Version: 1.1.2
// Last Verified Working: 2025-05-25
// Change: Updated telegram accounts list to show real handles
// ================================================================

// Handler for product notifications

import { BOT_TOKEN, MIN_IMAGES_REQUIRED, PRODUCT_GROUP_CHAT_ID } from "./config.ts";
import { sendImageMediaGroups } from "./telegram-api.ts";
import { logTelegramNotification } from "../shared/telegram-logger.ts";
import { getLocalTelegramAccounts, getTelegramForDisplay } from "../shared/telegram-config.ts";

/**
 * Handles product status change notifications
 * IMPORTANT: This function is critical for business operations
 * and has been thoroughly tested. Modify with extreme caution.
 */
export async function handleProductNotification(productId: string, notificationType: string | null, supabaseClient: any, corsHeaders: Record<string, string>) {
  // Load local telegram accounts from database
  const localTelegramAccounts = await getLocalTelegramAccounts();

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
  
  // Don't send notification if there are not enough images (except for sold notifications and product_published)
  if (notificationType !== 'sold' && notificationType !== 'product_published' && images.length < MIN_IMAGES_REQUIRED) {
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
      `👤 Telegram продавца: ${getTelegramForDisplay(messageData.telegram, localTelegramAccounts)}`,
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
      
      // Log successful sold notification
      await logTelegramNotification(supabaseClient, {
        function_name: 'send-telegram-notification',
        notification_type: 'product_sold',
        recipient_type: 'group',
        recipient_identifier: PRODUCT_GROUP_CHAT_ID,
        recipient_name: 'Product Group',
        message_text: messageText,
        status: 'sent',
        related_entity_type: 'product',
        related_entity_id: productId,
        metadata: {
          lot_number: product.lot_number,
          product_title: product.title,
          message_type: 'text_only'
        }
      });
      
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

  // Handle 'product_published' notification type - send full ad with images
  if (notificationType === 'product_published') {
    // For product_published (active status), send full ad with images like new product
    console.log('Sending full ad for published product with images');
    
    // Use the same message format as regular product notifications
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

  // Handle 'repost' notification type - send full ad with images and update timestamp
  if (notificationType === 'repost') {
    // For repost, send full ad with images like published product
    console.log('Sending repost notification with images');
    
    try {
      // Send the media group with images
      const result = await sendImageMediaGroups(
        images.map((image: any) => image.url), 
        messageText, 
        supabaseClient, 
        productId,
        PRODUCT_GROUP_CHAT_ID,
        corsHeaders,
        BOT_TOKEN
      );
      
      // Update the notification timestamp for repost cooldown
      const { error: updateError } = await supabaseClient
        .from('products')
        .update({ last_notification_sent_at: new Date().toISOString() })
        .eq('id', productId);
        
      if (updateError) {
        console.error('Error updating notification timestamp for repost:', updateError);
      } else {
        console.log('Successfully updated notification timestamp for repost');
      }
      
      // Log successful repost
      await supabaseClient.from('event_logs').insert({
        entity_type: 'product',
        entity_id: productId,
        action_type: 'repost',
        details: { 
          success: true, 
          notification_type: 'repost',
          lot_number: product.lot_number,
          product_title: product.title
        }
      });
      
      return result;
      
    } catch (error) {
      console.error('Error sending repost notification:', error);
      
      // Log failed repost
      await supabaseClient.from('event_logs').insert({
        entity_type: 'product',
        entity_id: productId,
        action_type: 'repost',
        details: { 
          success: false, 
          error: error.message,
          notification_type: 'repost'
        }
      });
      
      return new Response(
        JSON.stringify({ success: false, message: `Failed to send repost notification: ${error.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  }

  // Handle 'status_change' notification type
  if (notificationType === 'status_change') {
    // Skip notifications for pending status - no need to notify about moderation
    if (product.status === 'pending') {
      console.log('Skipping notification for pending status');
      return new Response(
        JSON.stringify({ success: true, message: 'Skipped notification for pending status' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    try {
      const statusMessages = {
        'active': '✅ Товар опубликован в каталоге',
        'sold': '😔 Товар помечен как проданный',
        'archived': '📦 Товар перемещен в архив'
      };
      
      const statusMessage = statusMessages[product.status] || `📄 Статус товара изменен на: ${product.status}`;
      const statusChangeText = `${statusMessage}
Лот #${product.lot_number}: ${product.title} ${product.brand}`;
      
      console.log(`Sending status change message to Telegram: ${statusChangeText}`);
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: PRODUCT_GROUP_CHAT_ID,
          text: statusChangeText,
          parse_mode: 'HTML'
        }),
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        console.error('Telegram API error for status change notification:', result);
        return new Response(
          JSON.stringify({ success: false, message: 'Failed to send status change notification' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      console.log('Status change notification sent successfully');
      
      // Log successful status change notification
      await logTelegramNotification(supabaseClient, {
        function_name: 'send-telegram-notification',
        notification_type: 'product_status_change',
        recipient_type: 'group',
        recipient_identifier: PRODUCT_GROUP_CHAT_ID,
        recipient_name: 'Product Group',
        message_text: statusChangeText,
        status: 'sent',
        related_entity_type: 'product',
        related_entity_id: productId,
        metadata: {
          lot_number: product.lot_number,
          product_title: product.title,
          old_status: 'pending',
          new_status: product.status
        }
      });
      
      // Update the notification timestamp
      const { error: updateError } = await supabaseClient
        .from('products')
        .update({ last_notification_sent_at: new Date().toISOString() })
        .eq('id', productId);
        
      if (updateError) {
        console.error('Error updating notification timestamp:', updateError);
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Status change notification sent successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error sending status change notification:', error);
      return new Response(
        JSON.stringify({ success: false, message: `Failed to send status change notification: ${error.message}` }),
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
