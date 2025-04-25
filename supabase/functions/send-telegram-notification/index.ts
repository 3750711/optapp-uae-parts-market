
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BOT_TOKEN = '8090742953:AAH4wZUmHFiD3x0kd_5q0oGLJZeyMl62KMA'
const GROUP_CHAT_ID = '4669451616'
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

    // Format the message text
    const message = `🆕 Новый товар опубликован!\n\n` +
      `📦 Название: ${product.title}\n` +
      `💰 Цена: ${product.price} $\n` +
      `🚗 Бренд: ${product.brand}\n` +
      `📝 Модель: ${product.model}\n` +
      (product.description ? `📄 Описание:\n${product.description}\n` : '') +
      `📦 Количество мест: ${product.place_number}\n` +
      (product.delivery_price ? `🚚 Стоимость доставки: ${product.delivery_price} $\n` : '')

    // First send the text message
    const messageResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: GROUP_CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        })
      }
    )

    // If there are images, send them as a media group
    if (product.product_images && product.product_images.length > 0) {
      const media = product.product_images.map((image: any) => ({
        type: 'photo',
        media: image.url
      }));

      // Send up to 10 images maximum (Telegram limit)
      const mediaToSend = media.slice(0, 10);
      
      await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: GROUP_CHAT_ID,
            media: mediaToSend
          })
        }
      )
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
