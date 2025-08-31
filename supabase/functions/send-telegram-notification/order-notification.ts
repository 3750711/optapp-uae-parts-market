
// ======================== IMPORTANT NOTICE ========================
// This file contains critical notification functionality.
// DO NOT EDIT unless absolutely necessary!
// 
// Any changes may affect the order notification system that sends
// messages to Telegram. This system is currently working properly.
// 
// Version: 1.1.0
// Last Verified Working: 2025-05-26
// Change: Updated notification format per requirements
// ================================================================

// Handler for order notifications

import { BOT_TOKEN, ORDER_GROUP_CHAT_ID, REGISTERED_GROUP_CHAT_ID, ORDER_BASE_URL } from "./config.ts";
import { waitBetweenBatches } from "./telegram-api.ts";
import { logTelegramNotification } from "../shared/telegram-logger.ts";
import { getLocalTelegramAccounts, getTelegramForDisplay } from "../shared/telegram-config.ts";

/**
 * Handles order creation notifications
 * IMPORTANT: This function is critical for business operations
 * and has been thoroughly tested. Modify with extreme caution.
 */
export async function handleOrderNotification(orderData: any, supabaseClient: any, corsHeaders: Record<string, string>, notificationType: string = 'regular') {
  console.log('Processing order notification, order #:', orderData.order_number, 'type:', notificationType);
  
  // Determine target group based on notification type
  const targetGroupId = notificationType === 'registered' ? REGISTERED_GROUP_CHAT_ID : ORDER_GROUP_CHAT_ID;
  const groupName = notificationType === 'registered' ? 'Registered Orders Group' : 'Order Group';
  
  console.log('Target group:', targetGroupId, '(' + groupName + ')');
  
  try {
    // Prepare order notification message with the updated format according to requirements
    const getStatusText = (status: string) => {
      switch (status) {
        case 'created': return 'Создан';
        case 'seller_confirmed': return 'Подтвержден продавцом';
        case 'admin_confirmed': return 'Подтвержден администратором';
        case 'processed': return 'Зарегистрирован';
        case 'shipped': return 'Отправлен';
        case 'delivered': return 'Доставлен';
        case 'cancelled': return 'Отменен';
        default: return status;
      }
    };
    
    const statusText = getStatusText(orderData.status);
                      
    const deliveryMethodText = orderData.delivery_method === 'cargo_rf' ? 'Доставка Cargo РФ' : 
                              orderData.delivery_method === 'self_pickup' ? 'Самовывоз' : 
                              orderData.delivery_method === 'cargo_kz' ? 'Доставка Cargo KZ' : 
                              orderData.delivery_method;
    
    // Create order link - only for internal use in the code, not shown in message
    const orderLink = `${ORDER_BASE_URL}${orderData.id}`;
    
    // Helper: normalize telegram username (supports raw username or t.me links)
    const normalizeTelegramUsername = (username: string | null | undefined): string => {
      if (!username) return '';
      let u = String(username).trim();
      // Strip t.me URL forms
      u = u.replace(/^https?:\/\/t\.me\//i, '').replace(/^@+/, '');
      // Basic validation: letters, numbers, underscore, 5-32 chars (keep simple here)
      if (!u) return '';
      return `@${u}`;
    };
    
    // Get local telegram accounts and determine display telegram
    let displayTelegram = '';
    try {
      // Fetch local telegram accounts from database
      const localAccounts = await getLocalTelegramAccounts();
      
      // Fetch seller telegram from profiles
      let sellerTelegram = '';
      if (orderData.seller_id) {
        const { data: sellerProfile, error: sellerErr } = await supabaseClient
          .from('profiles')
          .select('telegram')
          .eq('id', orderData.seller_id)
          .single();
        if (sellerErr) {
          console.warn('Could not fetch seller telegram from profiles:', sellerErr);
        } else {
          sellerTelegram = sellerProfile?.telegram;
        }
      }
      
      // Use fallback if no seller telegram found
      const telegramToCheck = sellerTelegram || orderData.telegram_url_order || '';
      
      // Determine display telegram using shared config logic
      displayTelegram = getTelegramForDisplay(telegramToCheck, localAccounts);
      
    } catch (e) {
      console.warn('Error with telegram config system, using fallback logic:', e);
      // Fallback to original logic
      const fallbackTelegram = normalizeTelegramUsername(orderData.telegram_url_order);
      displayTelegram = fallbackTelegram || 'Для заказа пересылайте лот @Nastya_PostingLots_OptCargo';
    }
    
    // Format order number with leading zero
    const formattedOrderNumber = orderData.order_number.toString().padStart(5, '0');
    
    // Compose name: title + brand + model in one line
    const nameParts = [orderData.title, orderData.brand, orderData.model].filter((v: string | null | undefined) => !!v && String(v).trim());
    const composedName = nameParts.join(' ').trim();
    
    // Updated message format per requirements:
    const messageText = [
      `Номер заказа: ${formattedOrderNumber}`,
      `Статус: ${statusText}`,
      displayTelegram,
      ``,
      `🟰🟰🟰🟰🟰🟰`,
      `Наименование: ${composedName}`,
      ``,
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
      orderImages = orderData.images.map((url: string) => url);
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
        orderImages = imagesData.map((img: any) => img.url);
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
      
      const mediaItems = firstBatchImages.map((imageUrl: string, index: number) => {
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
          chat_id: targetGroupId,
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
            chat_id: targetGroupId,
            text: messageText,
            parse_mode: 'HTML'
          }),
        });
        
        const textResult = await textMessageResponse.json();
        
        if (!textResult.ok) {
          console.error('Error sending fallback text message:', textResult.description);
          throw new Error(textResult.description || 'Failed to send order notification');
        } else {
          console.log('Fallback text message sent successfully');
          
          // Log successful fallback text message
          try {
            await logTelegramNotification(supabaseClient, {
              function_name: 'send-telegram-notification',
              notification_type: notificationType === 'registered' ? 'order_registered' : 'order_created',
              recipient_type: 'group',
              recipient_identifier: targetGroupId,
              recipient_name: groupName,
              message_text: messageText,
              status: 'sent',
              telegram_message_id: textResult.result?.message_id?.toString(),
              related_entity_type: 'order',
              related_entity_id: orderData.id,
              metadata: {
                order_number: orderData.order_number,
                images_count: firstBatchImages.length,
                message_type: 'fallback_text',
                original_media_failed: true
              }
            });
          } catch (logError) {
            console.error('Error logging fallback text notification:', logError);
          }
        }
      } else {
        console.log('First batch of images sent successfully with notification text');
        
        // Log successful order notification with images
        try {
          await logTelegramNotification(supabaseClient, {
            function_name: 'send-telegram-notification',
            notification_type: notificationType === 'registered' ? 'order_registered' : 'order_created',
            recipient_type: 'group',
            recipient_identifier: targetGroupId,
            recipient_name: groupName,
            message_text: messageText,
            status: 'sent',
            telegram_message_id: mediaResult.result?.[0]?.message_id?.toString(),
            related_entity_type: 'order',
            related_entity_id: orderData.id,
            metadata: {
              order_number: orderData.order_number,
              images_count: firstBatchImages.length,
              has_remaining_images: hasRemainingImages,
              message_type: 'media_group_with_text'
            }
          });
        } catch (logError) {
          console.error('Error logging media group notification:', logError);
        }
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
          chat_id: targetGroupId,
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
      
      // Log successful order notification (text only)
      try {
        await logTelegramNotification(supabaseClient, {
          function_name: 'send-telegram-notification',
          notification_type: notificationType === 'registered' ? 'order_registered' : 'order_created',
          recipient_type: 'group',
          recipient_identifier: targetGroupId,
          recipient_name: groupName,
          message_text: messageText,
          status: 'sent',
          telegram_message_id: textResult.result?.message_id?.toString(),
          related_entity_type: 'order',
          related_entity_id: orderData.id,
          metadata: {
            order_number: orderData.order_number,
            images_count: 0,
            message_type: 'text_only'
          }
        });
      } catch (logError) {
        console.error('Error logging text-only notification:', logError);
      }
    }
    
    // If we have remaining images (more than 10), send them in additional groups
    if (hasRemainingImages) {
      console.log(`Sending remaining ${remainingImages.length} images in additional message(s)`);
      
      // Caption for the remaining images
      const remainingCaption = `К заказу номер ${formattedOrderNumber}`;
      
      // Split remaining images into chunks of MAX_IMAGES_PER_GROUP (10) for media groups
      const remainingChunks = [];
      for (let i = 0; i < remainingImages.length; i += 10) {
        remainingChunks.push(remainingImages.slice(i, i + 10));
      }
      
      console.log(`Split remaining images into ${remainingChunks.length} chunks`);
      
      // Send each chunk of remaining images with increased delay between attempts
      for (let i = 0; i < remainingChunks.length; i++) {
        const chunk = remainingChunks[i];
        
        // Wait 5 seconds between chunks to avoid rate limits
        if (i > 0) {
          console.log(`Waiting 5 seconds before sending next chunk to avoid rate limits...`);
          await waitBetweenBatches(5000);
        }
        
        const mediaItems = chunk.map((imageUrl: string, index: number) => {
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
                chat_id: targetGroupId,
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
          
          // Try with a smaller number of images from this chunk if batch failed
          if (chunk.length > 5) {
            const smallerChunk = chunk.slice(0, 5);
            const smallerItems = smallerChunk.map((imageUrl: string, index: number) => {
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
                  chat_id: targetGroupId,
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
          
          // Log successful additional media group
          try {
            await logTelegramNotification(supabaseClient, {
              function_name: 'send-telegram-notification',
              notification_type: notificationType === 'registered' ? 'order_registered_additional' : 'order_created_additional',
              recipient_type: 'group',
              recipient_identifier: targetGroupId,
              recipient_name: groupName,
              message_text: remainingCaption,
              status: 'sent',
              telegram_message_id: mediaGroupResult?.result?.[0]?.message_id?.toString(),
              related_entity_type: 'order',
              related_entity_id: orderData.id,
              metadata: {
                order_number: orderData.order_number,
                images_count: chunk.length,
                chunk_number: i + 1,
                message_type: 'additional_media_group'
              }
            });
          } catch (logError) {
            console.error(`Error logging additional media group ${i+1}:`, logError);
          }
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
