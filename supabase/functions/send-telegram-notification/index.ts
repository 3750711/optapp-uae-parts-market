
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

// Function to validate image URLs and ensure they don't cause Telegram API issues
async function validateImageUrl(url: string): Promise<boolean> {
  if (!url) return false;
  
  try {
    // Check if URL is accessible
    const imageResponse = await fetch(url, { method: 'HEAD' });
    return imageResponse.ok;
  } catch (error) {
    console.error(`Error validating image URL ${url}:`, error);
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
      `📦 ${product.title} ${product.brand}${modelPart}\n` +
      `💰 Цена: ${product.price} $\n` +
      `🚚 Цена доставки: ${product.delivery_price || 0} $\n` +
      `🆔 OPT_ID продавца: ${product.optid_created || 'Не указан'}\n` +
      `👤 Telegram продавца: ${telegramContact}\n\n` +
      `📊 Статус: ${statusPrefix}${statusLabel}${statusSuffix}`;

    const validatedChatId = validateChatId(GROUP_CHAT_ID);
    console.log('Sending message to Telegram:', message);
    console.log('Using BOT_TOKEN:', BOT_TOKEN);
    console.log('Using GROUP_CHAT_ID:', validatedChatId);

    // Check if we have valid product images
    let hasValidImages = false;
    let validImagesArray = [];
    
    if (product.product_images && product.product_images.length > 0) {
      // Validate all images first
      const validationPromises = product.product_images.map(img => validateImageUrl(img.url));
      const validationResults = await Promise.all(validationPromises);
      
      // Filter only valid images
      validImagesArray = product.product_images.filter((img, index) => validationResults[index]);
      hasValidImages = validImagesArray.length > 0;
      
      console.log(`Found ${validImagesArray.length} valid images out of ${product.product_images.length}`);
    }

    // Sending message with images all at once
    if (hasValidImages) {
      try {
        // Send as a media group with the first image having the caption
        const mediaGroup = validImagesArray.map((img, index) => ({
          type: 'photo',
          media: img.url,
          // Only add caption to the first image
          caption: index === 0 ? message : undefined,
          parse_mode: index === 0 ? 'HTML' : undefined
        }));
        
        // Telegram API can only handle 10 media items per request
        // Split into chunks of 10 if needed
        const mediaChunks = [];
        for (let i = 0; i < mediaGroup.length; i += 10) {
          mediaChunks.push(mediaGroup.slice(i, i + 10));
        }
        
        // Send each chunk
        for (let i = 0; i < mediaChunks.length; i++) {
          const chunk = mediaChunks[i];
          
          // For first chunk, make sure we have the caption
          if (i > 0) {
            // If not the first chunk, no caption needed
            chunk.forEach(item => {
              item.caption = undefined;
              item.parse_mode = undefined;
            });
          }
          
          await callTelegramAPI('sendMediaGroup', {
            chat_id: validatedChatId,
            media: chunk
          });
          
          // Small delay between chunks if needed
          if (i < mediaChunks.length - 1) {
            await sleep(300);
          }
        }
      } catch (error) {
        console.error('Failed to send media group, falling back to text-only message:', error);
        // Fallback to text-only message
        await callTelegramAPI('sendMessage', {
          chat_id: validatedChatId,
          text: message,
          parse_mode: 'HTML'
        });
      }
    } else {
      // If no images, just send text message
      console.log('No valid images available, sending text-only message');
      const messageResult = await callTelegramAPI('sendMessage', {
        chat_id: validatedChatId,
        text: message,
        parse_mode: 'HTML'
      });
      
      console.log('Text message response:', messageResult);
    }
    
    // Check if the product has videos and send them in a separate message group
    if (product.product_videos && product.product_videos.length > 0) {
      try {
        // For Telegram, we need to send videos as a separate message
        // We'll send the first video with a simple caption
        const videoCaption = `Видео для лота #${formattedLotNumber}`;
        
        // Send first video with caption
        const firstVideo = product.product_videos[0];
        await callTelegramAPI('sendVideo', {
          chat_id: validatedChatId,
          video: firstVideo.url,
          caption: videoCaption
        });
        
        // Send remaining videos if any
        for (const video of product.product_videos.slice(1, 3)) { // Limit to 3 videos total
          await callTelegramAPI('sendVideo', {
            chat_id: validatedChatId,
            video: video.url
          });
          
          // Give a short pause between video sends
          await sleep(300);
        }
      } catch (videoError) {
        console.error('Error sending videos:', videoError);
        // Videos failed, but we already sent the main message, so continue
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
