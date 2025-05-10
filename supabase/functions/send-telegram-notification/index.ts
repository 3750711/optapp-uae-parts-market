
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

// Helper function to fetch image or video
async function fetchMediaContent(url: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}`);
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.error(`Error fetching media from ${url}:`, error);
    throw error;
  }
}

// Helper function to make API calls with retry logic for rate limiting
async function callTelegramAPI(endpoint: string, formData: FormData, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      console.log(`Calling Telegram API ${endpoint}`);
      
      const response = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`,
        {
          method: 'POST',
          body: formData
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

// Function to prepare and send a media group message
async function sendMediaGroupMessage(chatId: string, product: any, message: string) {
  try {
    // First, send text message
    const textFormData = new FormData();
    textFormData.append('chat_id', chatId);
    textFormData.append('text', message);
    textFormData.append('parse_mode', 'HTML');
    
    await callTelegramAPI('sendMessage', textFormData);
    
    // Collect all media items (photos and videos)
    const mediaItems = [];
    
    // Add photos
    if (product.product_images && product.product_images.length > 0) {
      const photos = product.product_images.slice(0, 10); // Telegram allows up to 10 media in a group
      for (const image of photos) {
        try {
          const mediaContent = await fetchMediaContent(image.url);
          const file = new File([mediaContent], 'photo.jpg', { type: 'image/jpeg' });
          mediaItems.push({
            type: 'photo',
            media: file
          });
        } catch (error) {
          console.error(`Failed to fetch image ${image.url}:`, error);
          // Continue with other images
        }
      }
    }
    
    // Add videos
    if (product.product_videos && product.product_videos.length > 0) {
      for (const video of product.product_videos) {
        try {
          const mediaContent = await fetchMediaContent(video.url);
          const file = new File([mediaContent], 'video.mp4', { type: 'video/mp4' });
          mediaItems.push({
            type: 'video',
            media: file
          });
        } catch (error) {
          console.error(`Failed to fetch video ${video.url}:`, error);
          // Continue with other videos
        }
      }
    }
    
    // Send media in groups of 10 (Telegram's limit)
    for (let i = 0; i < mediaItems.length; i += 10) {
      const mediaGroup = mediaItems.slice(i, i + 10);
      
      if (mediaGroup.length > 0) {
        const mediaFormData = new FormData();
        mediaFormData.append('chat_id', chatId);
        
        // Add each media file
        mediaGroup.forEach((item, index) => {
          mediaFormData.append(`photo${index}`, item.media);
        });
        
        // Send the media group
        if (mediaGroup[0].type === 'photo') {
          await callTelegramAPI('sendMediaGroup', mediaFormData);
        } else {
          // For videos
          await callTelegramAPI('sendVideo', mediaFormData);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error sending media group message:', error);
    throw error;
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
    
    // Build the message
    let message = `${eventPrefix}LOT(лот) #${formattedLotNumber}\n` +
      `📦 ${product.title} ${product.brand}${modelPart}\n` +
      `💰 Цена: ${product.price} $\n` +
      `🚚 Цена доставки: ${product.delivery_price || 0} $\n` +
      `🆔 OPT_ID продавца: ${product.optid_created || 'Не указан'}\n` +
      `👤 Telegram продавца: ${telegramContact}\n\n` +
      `📊 Статус: ${statusPrefix}${statusLabel}${statusSuffix}`;

    const validatedChatId = validateChatId(GROUP_CHAT_ID);
    console.log('Using BOT_TOKEN:', BOT_TOKEN);
    console.log('Using GROUP_CHAT_ID:', validatedChatId);

    // Send media group message with text, photos, and videos
    await sendMediaGroupMessage(validatedChatId, product, message);
    
    console.log('Notification sent successfully');

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
