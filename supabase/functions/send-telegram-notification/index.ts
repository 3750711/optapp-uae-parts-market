
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Updated with valid bot token and group chat ID
const BOT_TOKEN = '7251106221:AAE3UaXbAejz1SzkhknDTrsASjpe-glhL0s'
const GROUP_CHAT_ID = '-4623601047' // Main group chat ID for products
const ORDER_GROUP_CHAT_ID = '-4749346030' // Updated order-specific group chat ID
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

// Initialize Supabase client at the beginning of the function so it's available for all code blocks
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to wait
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to make API calls with retry logic for rate limiting
async function callTelegramAPI(endpoint: string, data: any, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      console.log(`Calling Telegram API ${endpoint} with data:`, JSON.stringify(data));
      
      const response = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        }
      );
      
      const result = await response.json();
      console.log(`Telegram API response:`, JSON.stringify(result));
      
      if (!response.ok) {
        // Check if it's a rate limit error
        if (response.status === 429 && result.parameters && result.parameters.retry_after) {
          const retryAfter = (result.parameters.retry_after + 1) * 1000; // Convert to ms and add buffer
          console.log(`Rate limited. Waiting for ${retryAfter}ms before retry. Attempt ${retries + 1}/${maxRetries}`);
          await sleep(retryAfter);
          retries++;
          continue;
        }
        
        throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
      }
      
      return result;
    } catch (error) {
      console.error(`API call failed:`, error);
      if (retries >= maxRetries - 1) {
        throw error;
      }
      console.error(`Retrying... (${retries + 1}/${maxRetries})`);
      await sleep(1000); // Wait 1 second before retry
      retries++;
    }
  }
}

// Ensure chat IDs are properly formatted (with minus sign for group chats)
function ensureProperChatId(chatId: string): string {
  if (!chatId) return GROUP_CHAT_ID; // Default to main group chat if empty
  
  // If it's a numeric string, ensure it has the minus sign for group chats
  if (/^\d+$/.test(chatId)) {
    // It's a numeric ID without minus, add it for group chats
    return `-${chatId}`;
  } else if (/^-?\d+$/.test(chatId)) {
    // Already has proper format (with or without minus)
    return chatId;
  }
  
  // For non-numeric IDs (like @username), return as is
  return chatId;
}

// Function to get status label in Russian
function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Ожидает проверки';
    case 'active':
      return 'Опубликован';
    case 'sold':
      return 'Продан';
    case 'archived':
      return 'Архив';
    default:
      return status;
  }
}

// Function to get order status label in Russian
function getOrderStatusLabel(status: string): string {
  switch (status) {
    case 'created':
      return 'Создан';
    case 'seller_confirmed':
      return 'Подтвержден продавцом';
    case 'admin_confirmed':
      return 'Подтвержден администратором';
    case 'processed':
      return 'Зарегистрирован';
    case 'shipped':
      return 'Отправлен';
    case 'delivered':
      return 'Доставлен';
    case 'cancelled':
      return 'Отменен';
    default:
      return status;
  }
}

// Function to format lot number with 00 prefix
function formatLotNumber(lotNumber: string | number | null): string {
  if (lotNumber === undefined || lotNumber === null) {
    return 'б/н';
  }
  
  const num = typeof lotNumber === 'string' ? parseInt(lotNumber, 10) : lotNumber;
  if (isNaN(Number(num))) return 'б/н';
  
  return `00${num}`;
}

// Function to check if telegram username is in the trusted list
function isTrustedSeller(telegramUsername: string | null | undefined): boolean {
  if (!telegramUsername) return false;
  
  // Normalize username by removing @ if present
  const normalizedUsername = telegramUsername.startsWith('@') 
    ? telegramUsername.substring(1) 
    : telegramUsername;
  
  // List of trusted Telegram usernames (without @ symbol)
  const trustedUsernames = [
    'Elena_gult',
    'SanSanichUAE',
    'OptSeller_Georgii',
    'Nastya_PostingLots_OptCargo',
    'OptSeller_IgorK'
  ];
  
  return trustedUsernames.includes(normalizedUsername);
}

// Enhanced fetch product function
async function fetchProductDetails(productId: string) {
  console.log(`Fetching complete product details for ID: ${productId}`);
  
  // Get full product details including images and videos
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('*, product_images(*), product_videos(*)')
    .eq('id', productId)
    .single();

  if (fetchError || !product) {
    throw new Error(fetchError?.message || `Failed to fetch product details for ID: ${productId}`);
  }
  
  console.log(`Successfully fetched product: ${product.title}, status: ${product.status}`);
  console.log(`Product has ${product.product_images?.length || 0} images and ${product.product_videos?.length || 0} videos`);
  
  return product;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST',
      }
    });
  }

  try {
    // Parse the request data
    const requestData = await req.json();
    console.log('Received request data:', JSON.stringify(requestData));

    // Handle product ID-only requests (used by the database trigger)
    if (requestData.productId && !requestData.product) {
      console.log(`Processing simplified product notification request for ID: ${requestData.productId}`);
      try {
        const product = await fetchProductDetails(requestData.productId);
        requestData.product = product;
        console.log(`Successfully fetched and attached product data for ID: ${requestData.productId}`);
      } catch (error) {
        console.error(`Failed to fetch product for ID ${requestData.productId}:`, error);
        return new Response(JSON.stringify({ 
          error: `Failed to fetch product data: ${error}`,
          message: 'Could not process product notification with ID-only request'
        }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Check if this is a product or order notification
    if (requestData.product) {
      const { product } = requestData;
      if (!product) {
        return new Response(JSON.stringify({ error: 'Missing product data' }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Auto-approve products from trusted sellers by setting status to 'active'
      if (product.status === 'pending' && isTrustedSeller(product.telegram_url)) {
        console.log(`Auto-approving product from trusted seller: ${product.telegram_url}`);
        
        const { data: updatedProduct, error: updateError } = await supabase
          .from('products')
          .update({ status: 'active' })
          .eq('id', product.id)
          .select()
          .single();
        
        if (updateError) {
          console.error("Failed to auto-approve product:", updateError);
        } else {
          console.log("Product auto-approved successfully");
          // Update the product object with the new status for the notification
          product.status = 'active';
        }
      }

      // List of OPT_IDs that require the special message
      const specialOptIds = ['BSHR', 'JAKI', 'KAZI', 'MDY', 'MIR', 'MMD', 'YKB'];
      
      // Check if the seller's OPT_ID is in the special list
      const isSpecialSeller = specialOptIds.includes(product.optid_created);
      
      // Customize the Telegram contact message based on seller type
      const telegramContact = isSpecialSeller
        ? 'Для заказа пересылайте лот @Nastya_PostingLots_OptCargo'
        : `${product.telegram_url ? '@'+product.telegram_url : 'Не указан'}`;

      // Get status label
      const statusLabel = getStatusLabel(product.status);

      // Format lot number with 00 prefix
      const formattedLotNumber = formatLotNumber(product.lot_number);

      // Add red exclamation marks for pending status
      const statusPrefix = product.status === 'pending' ? '❗️❗️❗️ ' : '';
      const statusSuffix = product.status === 'pending' ? ' ❗️❗️❗️' : '';

      // Check if this is a new product or status change
      const isNewProduct = product.status === 'pending';
      const eventPrefix = isNewProduct ? '🆕 НОВЫЙ ТОВАР! ' : '';

      // Get the model part of the message, but only include it if model is not null or empty
      const modelPart = product.model ? ` ${product.model}` : '';

      // Updated message format with highlighted status for pending items and new product indicator
      const message = `${eventPrefix}LOT(лот) #${formattedLotNumber}\n` +
        `📦 ${product.title} ${product.brand}${modelPart}\n` +
        `💰 Цена: ${product.price} $\n` +
        `🚚 Цена доставки: ${product.delivery_price || 0} $\n` +
        `🆔 OPT_ID продавца: ${product.optid_created || 'Не указан'}\n` +
        `👤 Telegram продавца: ${telegramContact}\n\n` +
        `📊 Статус: ${statusPrefix}${statusLabel}${statusSuffix}`;

      const validChatId = ensureProperChatId(GROUP_CHAT_ID);
      console.log('Sending message to Telegram:', message);
      console.log('Using BOT_TOKEN:', BOT_TOKEN);
      console.log('Using GROUP_CHAT_ID:', validChatId);

      // Check if we have images to send
      if (product.product_images && product.product_images.length > 0) {
        try {
          console.log(`Preparing to send ${product.product_images.length} images in media group(s)`);
          
          // Sort images so primary image is first
          const sortedImages = [...product.product_images].sort((a, b) => {
            if (a.is_primary) return -1;
            if (b.is_primary) return 1;
            return 0;
          });
          
          console.log(`Sorted images. Primary image is first: ${sortedImages[0].is_primary}`);
          
          // Ensure all images are included by breaking them into chunks of 10 (Telegram API limit)
          const imageChunks = [];
          for (let i = 0; i < sortedImages.length; i += 10) {
            imageChunks.push(sortedImages.slice(i, i + 10));
          }
          
          console.log(`Divided ${sortedImages.length} images into ${imageChunks.length} chunks`);
          
          // Send first chunk with the product description message attached
          const firstChunk = imageChunks[0];
          const firstMediaGroup = firstChunk.map((img: any, index: number) => {
            console.log(`Adding image to first group: ${img.url}`);
            return {
              type: 'photo',
              media: img.url,
              // Add caption only to the first image
              ...(index === 0 && {
                caption: message,
                parse_mode: 'HTML'
              })
            };
          });

          console.log(`Sending first chunk with ${firstChunk.length} images and caption`);
          const mediaResult = await callTelegramAPI('sendMediaGroup', {
            chat_id: validChatId,
            media: firstMediaGroup
          });
          
          console.log('First media group response:', mediaResult);
          
          // If there are additional chunks, send them without captions
          if (imageChunks.length > 1) {
            for (let i = 1; i < imageChunks.length; i++) {
              console.log(`Sending additional chunk ${i+1} with ${imageChunks[i].length} images`);
              // Add a delay before sending the next chunk to avoid rate limiting
              await sleep(2000);
              
              const additionalMediaGroup = imageChunks[i].map((img: any) => {
                console.log(`Adding image to additional group ${i+1}: ${img.url}`);
                return {
                  type: 'photo',
                  media: img.url
                };
              });
              
              await callTelegramAPI('sendMediaGroup', {
                chat_id: validChatId,
                media: additionalMediaGroup
              });
              
              console.log(`Additional chunk ${i+1} sent successfully`);
            }
          }
          
          // After sending all images, send videos separately if any exist
          if (product.product_videos && product.product_videos.length > 0) {
            // Add delay before sending videos
            await sleep(2000);
            
            console.log(`Sending ${product.product_videos.length} videos`);
            for (const video of product.product_videos) {
              try {
                await callTelegramAPI('sendVideo', {
                  chat_id: validChatId,
                  video: video.url
                });
                
                // Add delay between videos
                await sleep(2000);
              } catch (error) {
                console.error('Failed to send video:', error);
              }
            }
          }
        } catch (error) {
          console.error('Failed to send media group:', error);
          // If media group fails, try sending just text message
          try {
            await callTelegramAPI('sendMessage', {
              chat_id: validChatId,
              text: message,
              parse_mode: 'HTML'
            });
          } catch (fallbackError) {
            console.error('Failed to send fallback text message:', fallbackError);
          }
        }
      } else {
        // If no images, just send text message
        try {
          console.log('No images found, sending text-only message');
          const messageResult = await callTelegramAPI('sendMessage', {
            chat_id: validChatId,
            text: message,
            parse_mode: 'HTML'
          });
          
          console.log('Text message response:', messageResult);
          
          // If there are videos but no images, send them after the text message
          if (product.product_videos && product.product_videos.length > 0) {
            await sleep(2000);
            
            for (const video of product.product_videos) {
              try {
                await callTelegramAPI('sendVideo', {
                  chat_id: validChatId,
                  video: video.url
                });
                
                await sleep(2000);
              } catch (error) {
                console.error('Failed to send video:', error);
              }
            }
          }
        } catch (textError) {
          console.error('Failed to send text message:', textError);
          throw textError;
        }
      }
    } else if (requestData.order) {
      // Handle order notifications with new template format
      const { order, action } = requestData;
      
      if (!order) {
        return new Response(JSON.stringify({ error: 'Missing order data' }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log("Processing order notification with action:", action || 'undefined');

      // For Edge Functions, use waitUntil for tasks that can be continued after response is sent
      // This way we can quickly return success to the client while processing continues
      
      // Respond quickly to the client with success
      const responsePromise = new Response(JSON.stringify({ 
        success: true,
        message: 'Order notification queued for processing'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
      // The rest of the processing continues in the background without blocking the response
      const processingPromise = (async () => {
        // Fetch order images from the database if not already included
        let orderImages = order.images || [];
        
        // Улучшенная обработка изображений заказа
        if (orderImages.length === 0 && order.id) {
          try {
            console.log(`Fetching images for order ${order.id} from database...`);
            
            // Try to fetch images from order_images table
            const { data: orderImageData, error: imageError } = await supabase
              .from('order_images')
              .select('url')
              .eq('order_id', order.id);

            if (imageError) {
              console.error(`Error fetching order images from database:`, imageError);
              throw imageError;
            }

            if (orderImageData && orderImageData.length > 0) {
              orderImages = orderImageData.map(img => img.url);
              console.log(`Found ${orderImages.length} images for order ${order.id}:`, orderImages);
            } else {
              console.log(`No images found in order_images table for order ${order.id}`);
            }
          } catch (error) {
            console.error('Error in order image processing:', error);
            // Не останавливаем выполнение функции при проблемах с изображениями
            console.log('Continuing with notification without images');
          }
        } else {
          console.log(`Using ${orderImages.length} images provided in request payload`);
        }

        const orderNumber = order.order_number || 'Без номера';
        const orderStatus = getOrderStatusLabel(order.status);
        // Use proper action text based on action parameter (with fallback for missing action)
        const actionType = action || (order.status === 'created' ? 'create' : 'status_change');
        const actionText = actionType === 'create' ? 'СОЗДАН НОВЫЙ ЗАКАЗ!' : `ИЗМЕНЕН СТАТУС ЗАКАЗА на "${orderStatus}"`;
        const deliveryMethod = order.delivery_method === 'self_pickup' ? 'Самовывоз' : 
                              order.delivery_method === 'cargo_rf' ? 'Доставка Cargo РФ' : 
                              order.delivery_method === 'cargo_kz' ? 'Доставка Cargo KZ' : 'Не указан';
        
        // Create the order detail page URL
        const orderPageUrl = `https://partsbay.ae/admin/orders/${order.id}`;
        
        // Обновленный формат сообщения согласно новым требованиям
        const message = `Заказ № ${orderNumber}\n` +
          `Статус: ${orderStatus}\n` +
          `${order.telegram_url_order ? `Telegram отправителя: @${order.telegram_url_order}\n` : ''}\n` +
          `🟰🟰🟰🟰🟰🟰\n` +
          `Товар: ${order.title}\n` +
          `Бренд: ${order.brand || 'Не указан'}\n` +
          `Модель: ${order.model || 'Не указана'}\n` +
          `Количество мест для отправки: ${order.place_number || 1}\n` +
          `Доставка: ${deliveryMethod}\n` +
          `🔗 <a href="${orderPageUrl}">Страница заказа</a>\n` +
          (order.text_order ? `📋 Комментарий: ${order.text_order}\n` : '') + 
          `\n🟰🟰🟰🟰🟰🟰\n` +
          `Цена: ${order.price} $\n` +
          `Цена доставки: ${order.delivery_price_confirm || 0} $\n\n` +
          `===\n` +
          `${order.seller_opt_id || 'Не указан'}\n` +
          `${order.buyer_opt_id || 'Не указан'}`;

        // Use the updated order-specific group chat ID for orders
        const chatId = ORDER_GROUP_CHAT_ID;
        console.log('Sending order message to Telegram:', message);
        console.log('Using BOT_TOKEN:', BOT_TOKEN);
        console.log('Using ORDER_GROUP_CHAT_ID:', chatId);
        console.log('Images to send:', orderImages.length > 0 ? orderImages : 'No images');

        // Send order with images if available, otherwise just text
        if (orderImages && orderImages.length > 0) {
          try {
            console.log(`Preparing to send ${orderImages.length} images as media group`);
            
            // Send all images as a media group
            const mediaGroup = orderImages.slice(0, 10).map((imgUrl: string, index: number) => ({
              type: 'photo',
              media: imgUrl,
              // Add caption to the first image only
              ...(index === 0 && {
                caption: message,
                parse_mode: 'HTML'
              })
            }));

            console.log(`Media group prepared with ${mediaGroup.length} items`);

            await callTelegramAPI('sendMediaGroup', {
              chat_id: chatId,
              media: mediaGroup,
              disable_web_page_preview: true
            });
          } catch (error) {
            console.error('Failed to send order media group:', error);
            // If media group fails, try sending just the text message
            try {
              await callTelegramAPI('sendMessage', {
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true
              });
            } catch (textError) {
              console.error('Failed to send fallback text message:', textError);
            }
          }
        } else {
          // If no images, just send text message
          try {
            console.log('Sending text-only message (no images available)');
            await callTelegramAPI('sendMessage', {
              chat_id: chatId,
              text: message,
              parse_mode: 'HTML',
              disable_web_page_preview: true
            });
          } catch (textError) {
            console.error('Failed to send text message:', textError);
          }
        }
      })();

      // Use EdgeRuntime.waitUntil to let processing continue after response is sent
      EdgeRuntime.waitUntil(processingPromise);
      
      return responsePromise;
    } else {
      return new Response(JSON.stringify({ error: 'Invalid request data. Expected product or order object.' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Telegram notification error:', error);
    return new Response(JSON.stringify({ 
      error: String(error),
      message: 'Failed to send notification to Telegram. Please check the logs.'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
