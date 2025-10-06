
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
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Handles product status change notifications
 * IMPORTANT: This function is critical for business operations
 * and has been thoroughly tested. Modify with extreme caution.
 */
export async function handleProductNotification(productId: string, notificationType: string | null, supabaseClient: any, corsHeaders: Record<string, string>, req?: Request, priceChanged?: boolean, newPrice?: number, oldPrice?: number, requestId?: string) {
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

  // Idempotency check: prevent duplicate requests with same requestId
  if (requestId) {
    console.log('Checking for duplicate request with ID:', requestId);
    
    const { data: existingLog, error: logError } = await supabaseClient
      .from('event_logs')
      .select('id, details')
      .eq('action_type', 'product_repost')
      .eq('entity_id', productId)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Within last hour
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!logError && existingLog) {
      const duplicateRequest = existingLog.find(log => 
        log.details && 
        typeof log.details === 'object' && 
        'request_id' in log.details && 
        log.details.request_id === requestId
      );
      
      if (duplicateRequest) {
        console.log('Duplicate request detected, returning 409:', requestId);
        return new Response(
          JSON.stringify({ 
            error: 'Duplicate request', 
            message: 'This repost request was already processed',
            requestId 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
        );
      }
    }
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
  
  // STEP 1: Immediately update timestamp to prevent duplicate notifications
  // This prevents race conditions where the trigger fires multiple times
  const { error: lockError } = await supabaseClient
    .from('products')
    .update({ last_notification_sent_at: new Date().toISOString() })
    .eq('id', productId);
    
  if (lockError) {
    console.error('Error setting notification lock:', lockError);
    return new Response(
      JSON.stringify({ error: 'Failed to set notification lock' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  } else {
    console.log('✅ Notification lock set - preventing duplicate calls');
  }
  
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
  } else if (notificationType === 'repost' && priceChanged) {
    // Special repost message with SALE indicator and price change
    const brandModelText = formatBrandModel(product.brand, product.model);
    
    const messageData = {
      title: product.title,
      brandModel: brandModelText,
      price: product.price,
      oldPrice: oldPrice,
      deliveryPrice: product.delivery_price,
      lotNumber: product.lot_number,
      optId: product.optid_created || '',
      telegram: product.telegram_url || '',
      status: product.status
    };
    
    // Show only new price with fire emoji for sale indication
    const priceText = `${messageData.price} $🔥`;
    
    messageText = [
      `LOT(лот) #${messageData.lotNumber}❗️SALE❗️`,
      `📦 ${messageData.title}${messageData.brandModel}`,
      `💰 Цена: ${priceText}`,
      `🚚 Цена доставки: ${messageData.deliveryPrice} $`,
      `🆔 OPT_ID продавца: ${messageData.optId}`,
      `👤 Telegram продавца: ${getTelegramForDisplay(messageData.telegram, localTelegramAccounts)}`,
      '',
      `📊 Статус: ${messageData.status === 'active' ? 'Опубликован' : 
             messageData.status === 'sold' ? 'Продан' : 'На модерации'}`
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
    
    let userId: string | null = null;
    
    try {
      // Get authenticated user from JWT
      const authHeader = req?.headers.get('Authorization');
      if (!authHeader || !req) {
        return new Response(
          JSON.stringify({ success: false, message: 'Authentication required for repost' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      // Create client with auth context to get user info
      const authClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? "",
        Deno.env.get('SUPABASE_ANON_KEY') ?? "",
        { auth: { persistSession: false }, global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user }, error: authError } = await authClient.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid authentication' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      userId = user.id;

      // Get user profile to check if admin
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();

      const isAdmin = profile?.user_type === 'admin';

      // Check if user can repost this product (owner or admin)
      if (!isAdmin && product.seller_id !== userId) {
        return new Response(
          JSON.stringify({ success: false, message: 'You can only repost your own products' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }

      // Check repost cooldown (72 hours for non-admins)
      if (!isAdmin && product.last_notification_sent_at) {
        const lastNotificationTime = new Date(product.last_notification_sent_at).getTime();
        const currentTime = new Date().getTime();
        const timeDifferenceHours = (currentTime - lastNotificationTime) / (1000 * 60 * 60);
        const REPOST_COOLDOWN_HOURS = 72;

        if (timeDifferenceHours < REPOST_COOLDOWN_HOURS) {
          const hoursLeft = Math.ceil(REPOST_COOLDOWN_HOURS - timeDifferenceHours);
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: `Repost cooldown active. Try again in ${hoursLeft} hours.`,
              hoursLeft 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
          );
        }
      }
      
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
      
      // Log successful repost
      await supabaseClient.from('event_logs').insert({
        entity_type: 'product',
        entity_id: productId,
        user_id: userId,
        action_type: 'product_repost',
        details: { 
          success: true, 
          notification_type: 'repost',
          lot_number: product.lot_number,
          product_title: product.title,
          price_changed: priceChanged || false,
          new_price: priceChanged ? newPrice : undefined,
          old_price: priceChanged ? oldPrice : undefined,
          request_id: requestId
        }
      });
      
      return result;
      
    } catch (error) {
      console.error('Error sending repost notification:', error);
      
      // Log failed repost (include user_id if available)
      await supabaseClient.from('event_logs').insert({
        entity_type: 'product',
        entity_id: productId,
        user_id: userId,
        action_type: 'product_repost',
        details: { 
          success: false, 
          error: error.message,
          notification_type: 'repost',
          price_changed: priceChanged || false,
          new_price: priceChanged ? newPrice : undefined,
          old_price: priceChanged ? oldPrice : undefined,
          request_id: requestId
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
