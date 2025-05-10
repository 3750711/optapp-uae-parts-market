
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

// Improved function to validate image URLs
async function validateImageUrl(url: string): Promise<boolean> {
  if (!url) return false;
  
  try {
    // Ensure URL is properly formatted
    new URL(url);
    
    // Check if URL is accessible
    const imageResponse = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'Accept': '*/*'  // Accept any content type to allow more images to pass validation
      }
    });
    
    if (!imageResponse.ok) {
      console.log(`Image validation failed for ${url}: Status ${imageResponse.status}`);
      return false;
    }
    
    // Most images should have a content-type, but we're being more permissive
    const contentType = imageResponse.headers.get('content-type');
    if (contentType && !contentType.startsWith('image/')) {
      console.log(`URL doesn't return an image: ${url}, Content-Type: ${contentType}`);
      // Still return true if it's likely to be an image based on extension
      if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
        console.log(`But URL has image extension, allowing it: ${url}`);
        return true;
      }
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error validating image URL ${url}:`, error);
    // For some image storage services that block HEAD requests, 
    // check if the URL has an image extension and allow it
    if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
      console.log(`URL has image extension, allowing despite validation error: ${url}`);
      return true;
    }
    return false;
  }
}

// Similar function for video validation with more permissive checks
async function validateVideoUrl(url: string): Promise<boolean> {
  if (!url) return false;
  
  try {
    // Ensure URL is properly formatted
    new URL(url);
    
    // For videos, we'll be more permissive since some servers restrict HEAD requests
    // Check if the URL has a video extension
    if (url.match(/\.(mp4|mov|avi|wmv|flv|webm|mkv)$/i)) {
      console.log(`URL has video extension, allowing it: ${url}`);
      return true;
    }
    
    // Simple HEAD request to check if the URL is accessible
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        headers: {
          'Accept': '*/*'  // Accept any content type
        }
      });
      
      if (!response.ok) {
        console.log(`Video validation failed for ${url}: Status ${response.status}`);
        return false;
      }
      
      // For videos we don't strictly check content type as it might be various formats
      return true;
    } catch (fetchError) {
      // Some servers might block HEAD requests, try to handle gracefully
      console.log(`HEAD request failed for video ${url}, will try to allow it anyway`);
      return true;
    }
  } catch (error) {
    console.error(`Error validating video URL ${url}:`, error);
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

    // Improved handling of product images with more robust error handling
    let mediaToSend = [];
    let hasValidImages = false;
    
    if (product.product_images && product.product_images.length > 0) {
      console.log(`Product has ${product.product_images.length} images, validating them...`);
      
      // Validate each image URL with improved validation logic
      for (let i = 0; i < product.product_images.length; i++) {
        const img = product.product_images[i];
        console.log(`Validating image ${i}: ${img.url}`);
        
        // If URL is undefined or null, skip this image
        if (!img.url) {
          console.log(`Image ${i} has no URL, skipping`);
          continue;
        }
        
        try {
          // More permissive validation
          const isValid = await validateImageUrl(img.url);
          console.log(`Image ${i} (${img.url}): ${isValid ? 'Valid' : 'Invalid'}`);
          
          if (isValid) {
            mediaToSend.push({
              type: 'photo',
              media: img.url,
              caption: mediaToSend.length === 0 ? message : undefined, // Add caption only to first media
              parse_mode: mediaToSend.length === 0 ? 'HTML' : undefined
            });
          }
        } catch (validationError) {
          console.error(`Error validating image ${i}:`, validationError);
          // Continue with next image
        }
      }
      
      hasValidImages = mediaToSend.length > 0;
      console.log(`Found ${mediaToSend.length} valid images out of ${product.product_images.length}`);
    }

    let videoUrls = [];
    if (product.product_videos && product.product_videos.length > 0) {
      console.log(`Product has ${product.product_videos.length} videos, validating them...`);
      
      // Validate videos with more permissive validation
      for (const video of product.product_videos) {
        if (!video.url) {
          console.log(`Video has no URL, skipping`);
          continue;
        }
        
        try {
          console.log(`Validating video: ${video.url}`);
          const isValid = await validateVideoUrl(video.url);
          console.log(`Video (${video.url}): ${isValid ? 'Valid' : 'Invalid'}`);
          
          if (isValid) {
            videoUrls.push(video.url);
          }
        } catch (validationError) {
          console.error(`Error validating video:`, validationError);
          // Continue with next video
        }
      }
    }

    // If we have valid images, send as media group(s)
    if (hasValidImages) {
      try {
        // Telegram API can only handle 10 media items per request
        // Split into chunks of 10 if needed
        const mediaChunks = [];
        for (let i = 0; i < mediaToSend.length; i += 10) {
          mediaChunks.push(mediaToSend.slice(i, i + 10));
        }
        
        console.log(`Sending ${mediaChunks.length} media chunks`);
        
        // Send each chunk
        for (let i = 0; i < mediaChunks.length; i++) {
          const chunk = mediaChunks[i];
          
          // For other chunks, no caption needed
          if (i > 0) {
            chunk.forEach(item => {
              item.caption = undefined;
              item.parse_mode = undefined;
            });
          }
          
          // More robust error handling for media groups
          try {
            await callTelegramAPI('sendMediaGroup', {
              chat_id: validatedChatId,
              media: chunk
            });
          } catch (chunkError) {
            console.error(`Failed to send media chunk ${i}:`, chunkError);
            
            // If first chunk fails (with the caption), fall back to text-only message
            if (i === 0) {
              console.log('First chunk failed, falling back to text-only message');
              await callTelegramAPI('sendMessage', {
                chat_id: validatedChatId,
                text: message,
                parse_mode: 'HTML'
              });
            }
          }
          
          // Small delay between chunks to avoid rate limiting
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
    
    // Send videos if any
    if (videoUrls.length > 0) {
      try {
        // Send videos one by one
        const videoCaption = `Видео для лота #${formattedLotNumber}`;
        
        // Send first video with caption
        await callTelegramAPI('sendVideo', {
          chat_id: validatedChatId,
          video: videoUrls[0],
          caption: videoCaption
        });
        
        // Send remaining videos if any
        for (let i = 1; i < Math.min(videoUrls.length, 5); i++) { // Limit to 5 videos total to prevent spam
          try {
            await callTelegramAPI('sendVideo', {
              chat_id: validatedChatId,
              video: videoUrls[i]
            });
            
            // Give a short pause between video sends
            await sleep(300);
          } catch (videoError) {
            console.error(`Error sending video ${i}:`, videoError);
            // Continue with next video
          }
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
