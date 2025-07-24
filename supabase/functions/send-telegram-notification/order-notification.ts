
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

import { BOT_TOKEN, ORDER_GROUP_CHAT_ID, ORDER_BASE_URL } from "./config.ts";
import { waitBetweenBatches } from "./telegram-api.ts";

/**
 * Handles order creation notifications
 * IMPORTANT: This function is critical for business operations
 * and has been thoroughly tested. Modify with extreme caution.
 */
export async function handleOrderNotification(orderData: any, supabaseClient: any, corsHeaders: Record<string, string>) {
  console.log('Processing order notification, order #:', orderData.order_number);
  
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
    
    // List of users who should have their Telegram shown as-is
    const showTelegramAsIsUsers = [
      '@OptSeller_Anton',
      '@OptSeller_Georgii', 
      '@IgorD_OptSeller',
      '@OptSeller_IgorK',
      '@Pavel_optuae',
      '@SanSanichUAE',
      '@dmotrii_st',
      '@OptSeller_Vlad'
    ];
    
    // Check if the current seller's telegram should be shown as-is
    const telegramUrl = orderData.telegram_url_order || '';
    const shouldShowAsIs = showTelegramAsIsUsers.includes(telegramUrl);
    
    // Format order number with leading zero
    const formattedOrderNumber = orderData.order_number.toString().padStart(5, '0');
    
    // Updated format with requested changes:
    // 1. Order number with leading zero
    // 2. "Описание товара" changed to "Наименование"
    // 3. Show seller's telegram after "Подтвержден продавцом"
    const messageText = [
      `Номер заказа: ${formattedOrderNumber}`,
      `Статус: ${statusText}`,
      shouldShowAsIs ? telegramUrl : (telegramUrl || ''),
      ``,
      `🟰🟰🟰🟰🟰🟰`,
      `Наименование: ${orderData.title}`,
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
      `Продавец: ${orderData.seller_opt_id || ''}`,
      `Покупатель: ${orderData.buyer_opt_id || ''}`
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
