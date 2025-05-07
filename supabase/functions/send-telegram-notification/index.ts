
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BOT_TOKEN = '8090742953:AAH4wZUmHFiD3x0kd_5q0oGLJZeyMl62KMA'
const GROUP_CHAT_ID = '-4669451616'
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
      if (retries >= maxRetries - 1) {
        throw error;
      }
      console.error(`API call failed. Retrying... (${retries + 1}/${maxRetries})`);
      await sleep(1000); // Wait 1 second before retry
      retries++;
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST',
      }
    })
  }

  try {
    const { product } = await req.json()
    console.log('Received product data:', product)

    if (!product) {
      return new Response(JSON.stringify({ error: 'Missing product data' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Обновленный формат сообщения согласно запросу
    const message = `🔢 Номер обьявления: ${product.lot_number}\n` +
      `📦 ${product.title} ${product.brand} ${product.model}\n` +
      `💰 Цена: ${product.price} $\n` +
      `🚚 Цена доставки: ${product.delivery_price || 0} $\n` +
      `🆔 OPT_ID продавца: ${product.optid_created || 'Не указан'}\n` +
      `👤 Telegram продавца: ${product.telegram_url ? '@'+product.telegram_url : 'Не указан'}\n` +
      `\n🔍 Посмотреть товар: ${product.product_url}`;

    console.log('Sending message to Telegram:', message)
    console.log('Using BOT_TOKEN:', BOT_TOKEN)
    console.log('Using GROUP_CHAT_ID:', GROUP_CHAT_ID)

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
          // Add caption and button to the first image of the first group only
          ...(i === 0 && index === 0 && {
            caption: message,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [[
                {
                  text: "Посмотреть лот",
                  url: product.product_url
                }
              ]]
            }
          })
        }));

        const mediaResult = await callTelegramAPI('sendMediaGroup', {
          chat_id: GROUP_CHAT_ID,
          media: mediaGroup
        });
        
        console.log('Media group response:', mediaResult);
        
        // Add a small delay between groups to avoid rate limiting
        if (i < imageGroups.length - 1) {
          await sleep(300);
        }
      }
    } else {
      // If no images, just send text message with button
      const messageResult = await callTelegramAPI('sendMessage', {
        chat_id: GROUP_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            {
              text: "Посмотреть лот",
              url: product.product_url
            }
          ]]
        }
      });
      
      console.log('Text message response:', messageResult);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Telegram notification error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
