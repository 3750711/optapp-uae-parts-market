

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Updated with valid bot token and group chat ID
const BOT_TOKEN = '7251106221:AAE3UaXbAejz1SzkhknDTrsASjpe-glhL0s'
const GROUP_CHAT_ID = '-4623601047' // Main group chat ID for products
const ORDER_GROUP_CHAT_ID = '-2416102623' // Order-specific group chat ID
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

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
    'Nastya_PostingLots_OptCargo'
  ];
  
  return trustedUsernames.includes(normalizedUsername);
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
    const requestData = await req.json();
    console.log('Received request data:', JSON.stringify(requestData));

    // Check if this is a product or order notification
    if (requestData.product) {
      const { product } = requestData;
      if (!product) {
        return new Response(JSON.stringify({ error: 'Missing product data' }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Create Supabase client
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

      if (product.product_images && product.product_images.length > 0) {
        // Send all images as a media group
        const mediaGroup = product.product_images.slice(0, 10).map((img: any, index: number) => ({
          type: 'photo',
          media: img.url,
          // Add caption to the first image only
          ...(index === 0 && {
            caption: message,
            parse_mode: 'HTML'
          })
        }));

        try {
          const mediaResult = await callTelegramAPI('sendMediaGroup', {
            chat_id: validChatId,
            media: mediaGroup
          });
          
          console.log('Media group response:', mediaResult);
        } catch (error) {
          console.error('Failed to send media group:', error);
          // If media group fails, try sending just the text message
          await callTelegramAPI('sendMessage', {
            chat_id: validChatId,
            text: message,
            parse_mode: 'HTML'
          });
        }
        
        // After sending images, if there are videos, send them as separate messages
        if (product.product_videos && product.product_videos.length > 0) {
          // Add a small delay before sending videos to avoid rate limiting
          await sleep(500);
          
          for (const video of product.product_videos) {
            try {
              await callTelegramAPI('sendVideo', {
                chat_id: validChatId,
                video: video.url
              });
              
              // Add a small delay between videos to avoid rate limiting
              await sleep(300);
            } catch (error) {
              console.error('Failed to send video:', error);
            }
          }
        }
      } else {
        // If no images, just send text message
        const messageResult = await callTelegramAPI('sendMessage', {
          chat_id: validChatId,
          text: message,
          parse_mode: 'HTML'
        });
        
        console.log('Text message response:', messageResult);
        
        // If there are videos but no images, send videos after the text message
        if (product.product_videos && product.product_videos.length > 0) {
          await sleep(500); // Wait a bit before sending videos
          
          for (const video of product.product_videos) {
            try {
              await callTelegramAPI('sendVideo', {
                chat_id: validChatId,
                video: video.url
              });
              
              await sleep(300); // Small delay between videos
            } catch (error) {
              console.error('Failed to send video:', error);
            }
          }
        }
      }
    } else if (requestData.order) {
      // Handle order notifications
      const { order, action } = requestData;
      
      if (!order) {
        return new Response(JSON.stringify({ error: 'Missing order data' }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const orderNumber = order.order_number || 'Без номера';
      const orderStatus = getOrderStatusLabel(order.status);
      const actionText = action === 'create' ? 'СОЗДАН НОВЫЙ ЗАКАЗ!' : `ИЗМЕНЕН СТАТУС ЗАКАЗА на "${orderStatus}"`;
      const deliveryMethod = order.delivery_method === 'self_pickup' ? 'Самовывоз' : 
                             order.delivery_method === 'cargo_rf' ? 'Карго РФ' : 
                             order.delivery_method === 'cargo_kz' ? 'Карго KZ' : 'Не указан';
      
      const message = `🔔 ${actionText}\n\n` +
        `🛍 Заказ № ${orderNumber}\n` +
        `📦 Товар: ${order.title}\n` +
        `🏷 Бренд: ${order.brand || 'Не указан'}\n` +
        `📝 Модель: ${order.model || 'Не указана'}\n` +
        `💰 Цена: ${order.price} $\n` +
        `📦 Количество мест: ${order.place_number || 1}\n` +
        `🚚 Доставка: ${deliveryMethod}\n` +
        `💸 Цена доставки: ${order.delivery_price_confirm || 0} $\n` +
        `👨‍💼 Продавец: ${order.order_seller_name || 'Не указан'}\n` +
        `🆔 OPT_ID продавца: ${order.seller_opt_id || 'Не указан'}\n` +
        `👤 Получатель OPT_ID: ${order.buyer_opt_id || 'Не указан'}\n` +
        `📊 Статус: ${orderStatus}\n` +
        (order.description ? `📝 Описание: ${order.description}\n` : '') +
        (order.text_order ? `📋 Комментарий: ${order.text_order}\n` : '');

      // Use the order-specific group chat ID for orders
      const chatId = ORDER_GROUP_CHAT_ID;
      console.log('Sending order message to Telegram:', message);
      console.log('Using BOT_TOKEN:', BOT_TOKEN);
      console.log('Using ORDER_GROUP_CHAT_ID:', chatId);

      // Send order images if available
      if (order.images && order.images.length > 0) {
        // Send all images as a media group
        const mediaGroup = order.images.slice(0, 10).map((imgUrl: string, index: number) => ({
          type: 'photo',
          media: imgUrl,
          // Add caption to the first image only
          ...(index === 0 && {
            caption: message,
            parse_mode: 'HTML'
          })
        }));

        try {
          const mediaResult = await callTelegramAPI('sendMediaGroup', {
            chat_id: chatId,
            media: mediaGroup
          });
          
          console.log('Order media group response:', mediaResult);
        } catch (error) {
          console.error('Failed to send order media group:', error);
          // If media group fails, try sending just the text message
          await callTelegramAPI('sendMessage', {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
          });
        }
      } else {
        // If no images, just send text message
        const messageResult = await callTelegramAPI('sendMessage', {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
          });
        
        console.log('Order text message response:', messageResult);
      }
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

