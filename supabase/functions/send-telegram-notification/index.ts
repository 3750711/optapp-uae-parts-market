
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

    // Format the message text with lot number
    const message = `🆕 Новый товар опубликован!\n\n` +
      `📦 Название: ${product.title}\n` +
      `🔢 Номер товара: ${product.lot_number}\n` +
      `💰 Цена: ${product.price} $\n` +
      `🚗 Бренд: ${product.brand}\n` +
      `📝 Модель: ${product.model}\n` +
      (product.description ? `📄 Описание:\n${product.description}\n` : '') +
      `📦 Количество мест: ${product.place_number}\n` +
      (product.delivery_price ? `🚚 Стоимость доставки: ${product.delivery_price} $\n` : '')

    // Add seller info and product URL if available
    const additionalInfo = 
      (product.seller_name ? `👤 Продавец: ${product.seller_name}\n` : '') +
      (product.optid_created ? `🆔 ID продавца: ${product.optid_created}\n` : '') +
      (product.product_url ? `🔗 Ссылка: ${product.product_url}\n` : '');

    const fullMessage = message + additionalInfo;

    console.log('Sending message to Telegram:', fullMessage)
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
          // Add caption only to the first image of the first group
          ...(i === 0 && index === 0 ? { caption: fullMessage, parse_mode: 'HTML' } : {})
        }));

        const mediaResponse = await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: GROUP_CHAT_ID,
              media: mediaGroup
            })
          }
        )
        
        const mediaResult = await mediaResponse.json()
        console.log('Media group response:', mediaResult)
        
        if (!mediaResponse.ok) {
          throw new Error(`Telegram API error: ${JSON.stringify(mediaResult)}`)
        }
      }
    } else {
      // If no images, just send text message
      const messageResponse = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: GROUP_CHAT_ID,
            text: fullMessage,
            parse_mode: 'HTML'
          })
        }
      )
      
      const messageResult = await messageResponse.json()
      console.log('Text message response:', messageResult)
      
      if (!messageResponse.ok) {
        throw new Error(`Telegram API error: ${JSON.stringify(messageResult)}`)
      }
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
