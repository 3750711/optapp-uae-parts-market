
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

// Modified function with direct URL validation only
async function isURLAccessible(url: string): Promise<boolean> {
  if (!url) return false;
  
  try {
    // Ensure URL is properly formatted
    new URL(url);
    
    // Simple HEAD request to check if the URL is accessible
    try {
      const response = await fetch(url, { 
        method: 'HEAD'
      });
      
      return response.ok;
    } catch {
      // If HEAD fails, assume URL might still work for Telegram
      // especially for CDNs that might block HEAD requests
      return true;
    }
  } catch (error) {
    console.error(`URL validation error for ${url}:`, error);
    return false;
  }
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

    // Then try to send images if available
    if (product.product_images && product.product_images.length > 0) {
      console.log(`Product has ${product.product_images.length} images, sending them individually...`);
      
      // Send each image individually instead of as a group
      for (let i = 0; i < Math.min(product.product_images.length, 10); i++) {
        const img = product.product_images[i];
        if (!img.url) {
          console.log(`Image ${i} has no URL, skipping`);
          continue;
        }
        
        try {
          console.log(`Sending image ${i}: ${img.url}`);
          
          await callTelegramAPI('sendPhoto', {
            chat_id: validatedChatId,
            photo: img.url,
            caption: i === 0 ? `Изображения для лота #${formattedLotNumber}` : undefined
          });
          
          // Short delay between image sends
          if (i < product.product_images.length - 1) {
            await sleep(300);
          }
        } catch (imgError) {
          console.error(`Error sending image ${i}:`, imgError);
          // Continue with next image
        }
      }
    }

    // Finally send videos if available
    if (product.product_videos && product.product_videos.length > 0) {
      console.log(`Product has ${product.product_videos.length} videos, sending them...`);
      
      // Send videos one by one
      for (let i = 0; i < Math.min(product.product_videos.length, 3); i++) { // Limit to 3 videos
        const video = product.product_videos[i];
        if (!video.url) {
          console.log(`Video has no URL, skipping`);
          continue;
        }
        
        try {
          console.log(`Sending video ${i}: ${video.url}`);
          
          await callTelegramAPI('sendVideo', {
            chat_id: validatedChatId,
            video: video.url,
            caption: i === 0 ? `Видео для лота #${formattedLotNumber}` : undefined
          });
          
          // Give a short pause between video sends
          if (i < product.product_videos.length - 1) {
            await sleep(300);
          }
        } catch (videoError) {
          console.error(`Error sending video ${i}:`, videoError);
          // Try alternative method for video
          try {
            console.log('Trying to send as document instead...');
            await callTelegramAPI('sendDocument', {
              chat_id: validatedChatId,
              document: video.url,
              caption: i === 0 ? `Видео для лота #${formattedLotNumber}` : undefined
            });
          } catch (docError) {
            console.error('Failed to send as document too:', docError);
            // Continue with next video
          }
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
