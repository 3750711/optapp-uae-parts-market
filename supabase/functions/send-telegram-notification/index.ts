
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Telegram API constants
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '7251106221:AAE3UaXbAejz1SzkhknDTrsASjpe-glhL0s';
// Order notifications go to the original group
const ORDER_GROUP_CHAT_ID = Deno.env.get('TELEGRAM_GROUP_CHAT_ID_ORDERS') || '-4749346030'; 
// Product notifications go to the new group
const PRODUCT_GROUP_CHAT_ID = Deno.env.get('TELEGRAM_GROUP_CHAT_ID') || '-4623601047';

// Minimum number of images required to send a notification
const MIN_IMAGES_REQUIRED = 1;

// Maximum number of images per media group
const MAX_IMAGES_PER_GROUP = 10;

// Base URL for order links
const ORDER_BASE_URL = 'https://lovable.dev/projects/c014f9d5-5d5d-4d39-8818-e0435c781fa6/order/';

console.log('Environment:', {
  BOT_TOKEN_EXISTS: !!BOT_TOKEN,
  ORDER_GROUP_CHAT_ID_EXISTS: !!ORDER_GROUP_CHAT_ID,
  PRODUCT_GROUP_CHAT_ID_EXISTS: !!PRODUCT_GROUP_CHAT_ID
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? "",
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    );

    // Parse request body
    const reqData = await req.json();
    console.log('Received request data:', reqData);

    // Handle different notification types
    if (reqData.order && reqData.action === 'create') {
      return await handleOrderNotification(reqData.order, supabaseClient, corsHeaders);
    } else if (reqData.productId) {
      return await handleProductNotification(reqData.productId, reqData.notificationType, supabaseClient, corsHeaders);
    } else {
      console.log('Invalid request data: missing order or productId');
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: either order+action or productId required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * Handles order creation notifications
 */
async function handleOrderNotification(orderData, supabaseClient, corsHeaders) {
  console.log('Processing order notification, order #:', orderData.order_number);
  
  try {
    // Prepare order notification message with the updated format according to requirements
    const statusText = orderData.status === 'created' ? 'Создан' : 
                      orderData.status === 'seller_confirmed' ? 'Подтвержден продавцом' : 
                      orderData.status;
                      
    const deliveryMethodText = orderData.delivery_method === 'cargo_rf' ? 'Доставка Cargo РФ' : 
                              orderData.delivery_method === 'self_pickup' ? 'Самовывоз' : 
                              orderData.delivery_method === 'cargo_kz' ? 'Доставка Cargo KZ' : 
                              orderData.delivery_method;
    
    // Create order link - only for internal use in the code, not shown in message
    const orderLink = `${ORDER_BASE_URL}${orderData.id}`;
    
    // Updated format with OPT IDs swapped and removed Telegram buyer label
    // Added "Дополнительная информация" section after delivery method
    // Removed link to order
    const messageText = [
      `Номер заказа: ${orderData.order_number}`,
      `Статус: ${statusText}`,
      `${orderData.telegram_url_buyer || ''}`,
      ``,
      `🟰🟰🟰🟰🟰🟰`,
      `Описание товара: ${orderData.title}`,
      `Бренд: ${orderData.brand || ''}`,
      `Модель: ${orderData.model || ''}`,
      `Количество мест для отправки: ${orderData.place_number || 1}`,
      `Доставка: ${deliveryMethodText}`,
      ``,
      `Дополнительная информация: ${orderData.text_order || 'Не указана'}`,
      ``,
      `🟰🟰🟰🟰🟰🟰`,
      `Цена: ${orderData.price} $`,
      `Цена доставки: ${orderData.delivery_price_confirm || 0} $`,
      ``,
      `===`,
      `${orderData.seller_opt_id || ''}`,
      `${orderData.buyer_opt_id || ''}`
    ].join('\n');

    // First fetch order images from the database if available
    let orderImages = [];
    
    // Check if order has images directly from the payload
    if (orderData.images && orderData.images.length > 0) {
      console.log('Using images from order data payload:', orderData.images.length, 'images');
      orderImages = orderData.images.map(url => url);
    } else {
      // If no images in payload, fetch them from the database
      console.log('Fetching images from database for order:', orderData.id);
      const { data: imagesData, error: imagesError } = await supabaseClient
        .from('order_images')
        .select('url')
        .eq('order_id', orderData.id);
      
      if (imagesError) {
        console.error('Error fetching order images:', imagesError);
      } else if (imagesData && imagesData.length > 0) {
        console.log('Found', imagesData.length, 'images for order in database');
        orderImages = imagesData.map(img => img.url);
      }
    }
    
    // Determine if we have more than 10 images that need to be split
    const firstBatchImages = orderImages.slice(0, 10);
    const remainingImages = orderImages.slice(10);
    const hasRemainingImages = remainingImages.length > 0;
    
    console.log(`Total images: ${orderImages.length}, First batch: ${firstBatchImages.length}, Remaining: ${remainingImages.length}`);
    
    // If we have images for the first group, send them with the text
    if (firstBatchImages.length > 0) {
      console.log('Sending first batch of images with notification text');
      
      const mediaItems = firstBatchImages.map((imageUrl, index) => {
        // First image gets the caption
        if (index === 0) {
          return {
            type: 'photo',
            media: imageUrl,
            caption: messageText,
            parse_mode: 'HTML'
          };
        }
        return {
          type: 'photo',
          media: imageUrl
        };
      });
      
      // Send media group with the first 10 images and text
      const mediaGroupResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: ORDER_GROUP_CHAT_ID,
          media: mediaItems
        }),
      });
      
      const mediaResult = await mediaGroupResponse.json();
      
      if (!mediaResult.ok) {
        console.error('Error sending first batch of images:', mediaResult.description);
        
        // If sending media group fails, fall back to sending text message
        const textMessageResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: ORDER_GROUP_CHAT_ID,
            text: messageText,
            parse_mode: 'HTML'
          }),
        });
        
        const textResult = await textMessageResponse.json();
        
        if (!textResult.ok) {
          console.error('Error sending fallback text message:', textResult.description);
          throw new Error(textResult.description || 'Failed to send order notification');
        }
      } else {
        console.log('First batch of images sent successfully with notification text');
      }
    } else {
      // If no images, just send text message
      console.log('No images for first batch, sending text only message');
      
      const textMessageResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: ORDER_GROUP_CHAT_ID,
          text: messageText,
          parse_mode: 'HTML'
        }),
      });
      
      const textResult = await textMessageResponse.json();
      
      if (!textResult.ok) {
        console.error('Error sending order notification message:', textResult.description);
        throw new Error(textResult.description || 'Failed to send order notification');
      }
      
      console.log('Order notification text sent successfully');
    }
    
    // If we have remaining images (more than 10), send them in additional groups
    if (hasRemainingImages) {
      console.log(`Sending remaining ${remainingImages.length} images in additional message(s)`);
      
      // Caption for the remaining images
      const remainingCaption = `К заказу номер ${orderData.order_number}`;
      
      // Split remaining images into chunks of MAX_IMAGES_PER_GROUP (10) for media groups
      const remainingChunks = [];
      for (let i = 0; i < remainingImages.length; i += MAX_IMAGES_PER_GROUP) {
        remainingChunks.push(remainingImages.slice(i, i + MAX_IMAGES_PER_GROUP));
      }
      
      console.log(`Split remaining images into ${remainingChunks.length} chunks`);
      
      // Wait between sending batches to avoid rate limits
      const waitBetweenBatches = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Send each chunk of remaining images with increased delay between attempts
      for (let i = 0; i < remainingChunks.length; i++) {
        const chunk = remainingChunks[i];
        
        // Wait 5 seconds between chunks to avoid rate limits
        if (i > 0) {
          console.log(`Waiting 5 seconds before sending next chunk to avoid rate limits...`);
          await waitBetweenBatches(5000);
        }
        
        const mediaItems = chunk.map((imageUrl, index) => {
          // First image of each group gets the caption
          if (index === 0) {
            return {
              type: 'photo',
              media: imageUrl,
              caption: remainingCaption
            };
          }
          return {
            type: 'photo',
            media: imageUrl
          };
        });
        
        console.log(`Sending remaining images chunk ${i+1} with ${chunk.length} images`);
        
        // Retry media group sending up to 3 times in case of failure
        let mediaGroupResult = null;
        let retryCount = 0;
        const maxRetries = 5; // Increased from 3 to 5 for more reliability
        
        while (retryCount < maxRetries) {
          try {
            const mediaGroupResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chat_id: ORDER_GROUP_CHAT_ID,
                media: mediaItems
              }),
            });
            
            mediaGroupResult = await mediaGroupResponse.json();
            console.log(`Remaining images chunk ${i+1}, attempt ${retryCount+1} response:`, 
              mediaGroupResult.ok ? 'SUCCESS' : 'FAILED');
            
            if (mediaGroupResult.ok) {
              break; // Exit retry loop on success
            } else {
              const retryAfter = mediaGroupResult.parameters?.retry_after || 10;
              console.error(`Error sending remaining images chunk ${i+1}, attempt ${retryCount+1}:`, 
                mediaGroupResult.description || 'Unknown error', 
                `Retry after: ${retryAfter} seconds`);
              retryCount++;
              
              if (retryCount < maxRetries) {
                // Wait longer between retries (exponential backoff + retry_after)
                const waitTime = (Math.pow(2, retryCount) * 1000) + (retryAfter * 1000);
                console.log(`Waiting ${waitTime/1000} seconds before retry ${retryCount+1}...`);
                await waitBetweenBatches(waitTime);
                console.log(`Retrying remaining images chunk ${i+1}, attempt ${retryCount+1}...`);
              }
            }
          } catch (error) {
            console.error(`Network error sending remaining images chunk ${i+1}, attempt ${retryCount+1}:`, error);
            retryCount++;
            
            if (retryCount < maxRetries) {
              // Wait longer between retries for network errors
              const waitTime = Math.pow(2, retryCount) * 2000;
              console.log(`Waiting ${waitTime/1000} seconds before retry ${retryCount+1}...`);
              await waitBetweenBatches(waitTime);
            }
          }
        }
        
        // Check if we exceeded retry count
        if (retryCount >= maxRetries) {
          console.error(`Failed to send remaining images chunk ${i+1} after ${maxRetries} attempts`);
          // Don't throw error, continue with next chunks
          
          // Try with a smaller number of images from this chunk if batch failed
          if (chunk.length > 5) {
            const smallerChunk = chunk.slice(0, 5);
            const smallerItems = smallerChunk.map((imageUrl, index) => {
              if (index === 0) {
                return {
                  type: 'photo',
                  media: imageUrl,
                  caption: `${remainingCaption} (часть ${i+1})`
                };
              }
              return {
                type: 'photo',
                media: imageUrl
              };
            });
            
            console.log(`Trying with smaller batch of ${smallerChunk.length} images...`);
            await waitBetweenBatches(3000);
            
            try {
              const smallerResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  chat_id: ORDER_GROUP_CHAT_ID,
                  media: smallerItems
                }),
              });
              
              const smallerResult = await smallerResponse.json();
              console.log(`Smaller batch result:`, smallerResult.ok ? 'SUCCESS' : 'FAILED');
            } catch (error) {
              console.error(`Error sending smaller batch:`, error);
            }
          }
        } else {
          console.log(`Successfully sent remaining images chunk ${i+1} with ${chunk.length} images`);
        }
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, message: 'Order notification sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending order notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

/**
 * Handles product status change notifications
 */
async function handleProductNotification(productId, notificationType, supabaseClient, corsHeaders) {
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
  
  // Prepare the notification message based on notification type
  let messageText = "";

  if (notificationType === 'sold') {
    // Create specialized message for sold products
    messageText = [
      `😔 Жаль, но Лот #${product.lot_number} ${product.title} ${product.brand || ''} ${product.model || ''} уже ушел!`,
      `Кто-то оказался быстрее... в следующий раз повезет - будь начеку.`
    ].join('\n');
  } else {
    // Standard notification for status changes or new products
    const messageData = {
      title: product.title,
      price: product.price,
      deliveryPrice: product.delivery_price,
      lotNumber: product.lot_number,
      optId: product.optid_created || '',
      telegram: product.telegram_url || '',
      status: product.status
    };
    
    messageText = [
      `LOT(лот) #${messageData.lotNumber}`,
      `📦 ${messageData.title}`,
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
    images.map(image => image.url), 
    messageText, 
    supabaseClient, 
    productId,
    PRODUCT_GROUP_CHAT_ID,
    corsHeaders
  );
}

/**
 * Sends images in media groups with optional message text
 */
async function sendImageMediaGroups(imageUrls, messageText, supabaseClient, productId, chatId, corsHeaders) {
  try {
    if (!imageUrls || imageUrls.length === 0) {
      console.log('No images to send');
      return new Response(
        JSON.stringify({ success: true, message: 'Notification sent successfully (no images)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Preparing to send', imageUrls.length, 'images in media group(s)');
    
    // Split images into chunks of MAX_IMAGES_PER_GROUP (10) for media groups
    const imageChunks = [];
    for (let i = 0; i < imageUrls.length; i += MAX_IMAGES_PER_GROUP) {
      imageChunks.push(imageUrls.slice(i, i + MAX_IMAGES_PER_GROUP));
    }
    
    console.log('Divided', imageUrls.length, 'images into', imageChunks.length, 'chunks');
    
    // Send each chunk as a media group
    let allMediaGroupsSuccessful = true;
    
    // Add delay function for rate limiting
    const waitBetweenBatches = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (let i = 0; i < imageChunks.length; i++) {
      const chunk = imageChunks[i];
      const mediaItems = [];
      
      // Wait between chunks to avoid rate limits
      if (i > 0) {
        console.log(`Waiting 5 seconds before sending chunk ${i+1} to avoid rate limits...`);
        await waitBetweenBatches(5000);
      }
      
      // Add each image to the group
      for (let j = 0; j < chunk.length; j++) {
        const imageUrl = chunk[j];
        console.log(`Adding image to ${i === 0 ? 'first' : 'next'} group:`, imageUrl);
        
        // Add caption only to the first image of the first group
        const isFirstImageOfFirstGroup = i === 0 && j === 0;
        const mediaItem = {
          type: 'photo',
          media: imageUrl,
        };
        
        if (isFirstImageOfFirstGroup && messageText) {
          mediaItem.caption = messageText;
          mediaItem.parse_mode = 'HTML';
        }
        
        mediaItems.push(mediaItem);
      }
      
      console.log(`Sending ${i === 0 ? 'first' : 'next'} chunk with ${chunk.length} images${i === 0 ? ' and caption' : ''}`);
      
      // Retry media group sending up to 5 times in case of failure
      let mediaGroupResult = null;
      let retryCount = 0;
      const maxRetries = 5; // Increased from 3 to 5
      
      while (retryCount < maxRetries) {
        try {
          // Send the media group to the appropriate chat ID
          const mediaGroupResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: chatId,
              media: mediaItems,
            }),
          });
          
          mediaGroupResult = await mediaGroupResponse.json();
          console.log(`Media group ${i + 1} attempt ${retryCount + 1} response:`, 
            mediaGroupResult.ok ? 'SUCCESS' : 'FAILED');
          
          if (mediaGroupResult.ok) {
            break; // Exit retry loop on success
          } else {
            const retryAfter = mediaGroupResult.parameters?.retry_after || 10;
            console.error(`Error sending media group ${i + 1}, attempt ${retryCount + 1}:`, 
              mediaGroupResult.description || 'Unknown error',
              `Retry after: ${retryAfter} seconds`);
            retryCount++;
            
            if (retryCount < maxRetries) {
              // Wait longer between retries (exponential backoff + retry_after)
              const waitTime = (Math.pow(2, retryCount) * 1000) + (retryAfter * 1000);
              console.log(`Waiting ${waitTime/1000} seconds before retry ${retryCount+1}...`);
              await waitBetweenBatches(waitTime);
              console.log(`Retrying media group ${i + 1}, attempt ${retryCount + 1}...`);
            }
          }
        } catch (error) {
          console.error(`Network error sending media group ${i + 1}, attempt ${retryCount + 1}:`, error);
          retryCount++;
          
          if (retryCount < maxRetries) {
            // Wait longer between retries for network errors
            const waitTime = Math.pow(2, retryCount) * 2000;
            console.log(`Waiting ${waitTime/1000} seconds before retry ${retryCount+1}...`);
            await waitBetweenBatches(waitTime);
            console.log(`Retrying media group ${i + 1} after network error, attempt ${retryCount + 1}...`);
          }
        }
      }
      
      // Check if we exceeded retry count
      if (retryCount >= maxRetries) {
        console.error(`Failed to send media group ${i + 1} after ${maxRetries} attempts`);
        allMediaGroupsSuccessful = false;
        
        // Try with a smaller number of images if batch failed
        if (chunk.length > 5) {
          const smallerChunk = chunk.slice(0, 5);
          const smallerItems = smallerChunk.map((imageUrl, index) => {
            if (index === 0 && i === 0) {
              return {
                type: 'photo',
                media: imageUrl,
                caption: messageText,
                parse_mode: 'HTML'
              };
            }
            return {
              type: 'photo',
              media: imageUrl
            };
          });
          
          console.log(`Trying with smaller batch of ${smallerChunk.length} images...`);
          await waitBetweenBatches(3000);
          
          try {
            const smallerResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chat_id: chatId,
                media: smallerItems
              }),
            });
            
            const smallerResult = await smallerResponse.json();
            console.log(`Smaller batch result:`, smallerResult.ok ? 'SUCCESS' : 'FAILED');
          } catch (error) {
            console.error(`Error sending smaller batch:`, error);
          }
        }
      }
      
      if (i === 0 && mediaGroupResult) {
        console.log('First media group detailed response:', JSON.stringify(mediaGroupResult));
      }
    }
    
    // Update the notification timestamp to indicate a successful send (only for product notifications, not order notifications)
    if (allMediaGroupsSuccessful && productId) {
      const { error: updateError } = await supabaseClient
        .from('products')
        .update({ 
          last_notification_sent_at: new Date().toISOString() 
        })
        .eq('id', productId);
        
      if (updateError) {
        console.error('Error updating notification timestamp:', updateError);
      } else {
        console.log('Successfully updated notification timestamp after sending');
      }
    } else if (!allMediaGroupsSuccessful && productId) {
      // If some media groups failed, reset notification timestamp to allow retry
      const { error: updateError } = await supabaseClient
        .from('products')
        .update({ last_notification_sent_at: null })
        .eq('id', productId);
        
      if (updateError) {
        console.error('Error resetting notification timestamp after failure:', updateError);
      } else {
        console.log('Reset notification timestamp to allow retry after partial failure');
      }
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: allMediaGroupsSuccessful, 
        message: allMediaGroupsSuccessful 
          ? 'Notification sent successfully' 
          : 'Notification partially sent, some image groups failed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending media groups:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}
