
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

    // Updated message format with status
    const message = `🔢 Номер обьявления: ${product.lot_number}\n` +
      `📦 ${product.title} ${product.brand} ${product.model}\n` +
      `💰 Цена: ${product.price} $\n` +
      `🚚 Цена доставки: ${product.delivery_price || 0} $\n` +
      `📊 Статус: ${statusLabel}\n` +
      `🆔 OPT_ID продавца: ${product.optid_created || 'Не указан'}\n` +
      `👤 Telegram продавца: ${telegramContact}`;

    const validatedChatId = validateChatId(GROUP_CHAT_ID);
    console.log('Sending message to Telegram:', message);
    console.log('Using BOT_TOKEN:', BOT_TOKEN);
    console.log('Using GROUP_CHAT_ID:', validatedChatId);

    if (product.product_images && product.product_images.length > 0) {
      // Split images into groups of 10 (Telegram's limit)
      const imageGroups = [];
      for (let i = 0; i < product.product_images.length; i += 10) {
        imageGroups.push(product.product_images.slice(i, i + 10));
      }

      // Send each group of images
      for (let i = 0; i < imageGroups.length; i++) {
        const mediaGroup = imageGroups[i].map((img: any, index: number) => ({
          type: 'photo',
          media: img.url,
          // Add caption to the first image of the first group only
          ...(i === 0 && index === 0 && {
            caption: message,
            parse_mode: 'HTML'
          })
        }));

        try {
          const mediaResult = await callTelegramAPI('sendMediaGroup', {
            chat_id: validatedChatId,
            media: mediaGroup
          });
          
          console.log('Media group response:', mediaResult);
        } catch (error) {
          console.error('Failed to send media group:', error);
          // If media group fails, try sending just the text message
          await callTelegramAPI('sendMessage', {
            chat_id: validatedChatId,
            text: message,
            parse_mode: 'HTML'
          });
        }
        
        // Add a small delay between groups to avoid rate limiting
        if (i < imageGroups.length - 1) {
          await sleep(300);
        }
      }
    } else {
      // If no images, just send text message
      const messageResult = await callTelegramAPI('sendMessage', {
        chat_id: validatedChatId,
        text: message,
        parse_mode: 'HTML'
      });
      
      console.log('Text message response:', messageResult);
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
