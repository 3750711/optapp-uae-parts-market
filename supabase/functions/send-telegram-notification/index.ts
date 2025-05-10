

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Updated with valid bot token and group chat ID
const BOT_TOKEN = '7251106221:AAE3UaXbAejz1SzkhknDTrsASjpe-glhL0s'
const GROUP_CHAT_ID = '-4623601047' // Added minus sign as it's likely a group chat ID
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

// Added validation function for chat ID
function validateChatId(chatId: string): string {
  // Group chat IDs in Telegram should start with a minus sign
  if (chatId && !chatId.startsWith('-') && !isNaN(Number(chatId))) {
    return `-${chatId}`;
  }
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

// Function to format lot number with 00 prefix
function formatLotNumber(lotNumber: string | number | null): string {
  if (lotNumber === undefined || lotNumber === null) {
    return 'б/н';
  }
  
  const num = typeof lotNumber === 'string' ? parseInt(lotNumber, 10) : lotNumber;
  if (isNaN(Number(num))) return 'б/н';
  
  return `00${num}`;
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
    const { product } = await req.json();
    console.log('Received product data:', JSON.stringify(product));

    if (!product) {
      return new Response(JSON.stringify({ error: 'Missing product data' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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
      `📦 ${product.title} ${product.brand || ''}${modelPart}\n` +
      `💰 Цена: ${product.price} $\n` +
      `🚚 Цена доставки: ${product.delivery_price || 0} $\n` +
      `🆔 OPT_ID продавца: ${product.optid_created || 'Не указан'}\n` +
      `👤 Telegram продавца: ${telegramContact}\n\n` +
      `📊 Статус: ${statusPrefix}${statusLabel}${statusSuffix}`;

    const validatedChatId = validateChatId(GROUP_CHAT_ID);
    console.log('Sending message to Telegram:', message);
    console.log('Using BOT_TOKEN:', BOT_TOKEN);
    console.log('Using GROUP_CHAT_ID:', validatedChatId);

    // First send text message
    await callTelegramAPI('sendMessage', {
      chat_id: validatedChatId,
      text: message,
      parse_mode: 'HTML'
    });

    // Отправка изображений по отдельности с прямой передачей URL
    if (product.product_images && product.product_images.length > 0) {
      console.log(`Product has ${product.product_images.length} images, sending them individually...`);
      
      // Отправляем только первые 10 изображений (ограничение Telegram)
      const imagesToSend = product.product_images.slice(0, 10);
      
      for (let i = 0; i < imagesToSend.length; i++) {
        const img = imagesToSend[i];
        if (!img.url) continue;
        
        try {
          console.log(`Sending image ${i+1}/${imagesToSend.length}: ${img.url}`);
          
          // Обходим ограничение путем использования подхода с формой и файлом
          const response = await fetch(img.url);
          if (!response.ok) {
            console.error(`Failed to fetch image from URL: ${img.url}`);
            continue;
          }
          
          const imageBlob = await response.blob();
          const formData = new FormData();
          formData.append('chat_id', validatedChatId);
          
          // Добавляем подпись только к первому изображению
          if (i === 0) {
            formData.append('caption', `Изображения для лота #${formattedLotNumber}`);
          }
          
          // Создаем уникальное имя файла для каждого изображения
          const fileName = `product_image_${Date.now()}_${i}.jpg`;
          formData.append('photo', new File([imageBlob], fileName, { type: 'image/jpeg' }));
          
          const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: formData
          });
          
          const resultData = await telegramResponse.json();
          console.log(`Telegram sendPhoto response:`, JSON.stringify(resultData));
          
          if (!telegramResponse.ok) {
            console.error(`Error sending image ${i+1}: ${JSON.stringify(resultData)}`);
          }
          
          // Небольшая пауза между отправками, чтобы избежать ограничений Telegram API
          if (i < imagesToSend.length - 1) {
            await sleep(300);
          }
        } catch (imgError) {
          console.error(`Error processing image ${i+1}:`, imgError);
        }
      }
    }

    // Отправка видео с аналогичным подходом
    if (product.product_videos && product.product_videos.length > 0) {
      console.log(`Product has ${product.product_videos.length} videos, sending them...`);
      
      // Ограничиваем количество видео до 3
      const videosToSend = product.product_videos.slice(0, 3);
      
      for (let i = 0; i < videosToSend.length; i++) {
        const video = videosToSend[i];
        if (!video.url) continue;
        
        try {
          console.log(`Sending video ${i+1}/${videosToSend.length}: ${video.url}`);
          
          const response = await fetch(video.url);
          if (!response.ok) {
            console.error(`Failed to fetch video from URL: ${video.url}`);
            continue;
          }
          
          const videoBlob = await response.blob();
          const formData = new FormData();
          formData.append('chat_id', validatedChatId);
          
          // Добавляем подпись только к первому видео
          if (i === 0) {
            formData.append('caption', `Видео для лота #${formattedLotNumber}`);
          }
          
          // Создаем уникальное имя файла для каждого видео
          const fileName = `product_video_${Date.now()}_${i}.mp4`;
          formData.append('video', new File([videoBlob], fileName, { type: 'video/mp4' }));
          
          const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`, {
            method: 'POST',
            body: formData
          });
          
          const resultData = await telegramResponse.json();
          console.log(`Telegram sendVideo response:`, JSON.stringify(resultData));
          
          if (!telegramResponse.ok) {
            console.error(`Error sending video ${i+1}: ${JSON.stringify(resultData)}`);
            
            // Если не удалось отправить как видео, пробуем отправить как документ
            console.log('Trying to send as document instead...');
            
            const docFormData = new FormData();
            docFormData.append('chat_id', validatedChatId);
            
            if (i === 0) {
              docFormData.append('caption', `Видео для лота #${formattedLotNumber} (документ)`);
            }
            
            docFormData.append('document', new File([videoBlob], fileName));
            
            const docTelegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
              method: 'POST',
              body: docFormData
            });
            
            const docResultData = await docTelegramResponse.json();
            console.log(`Telegram sendDocument response:`, JSON.stringify(docResultData));
          }
          
          // Пауза между отправками видео
          if (i < videosToSend.length - 1) {
            await sleep(500);
          }
        } catch (videoError) {
          console.error(`Error processing video ${i+1}:`, videoError);
        }
      }
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

