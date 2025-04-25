
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Use string format for token and chat ID - this is crucial for Telegram API
const BOT_TOKEN = '8090742953:AAH4wZUmHFiD3x0kd_5q0oGLJZeyMl62KMA'
const GROUP_CHAT_ID = '-4669451616' // Added hyphen prefix for group chat ID
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
          text: fullMessage,
        })
      }
    )
    
    const messageResult = await messageResponse.json()
    console.log('Telegram message API response:', messageResult)
    
    if (!messageResponse.ok) {
      throw new Error(`Telegram API error: ${JSON.stringify(messageResult)}`)
    }

    // If there are images, first send the primary image separately
    if (product.product_images && product.product_images.length > 0) {
      const primaryImage = product.product_images.find((img: any) => img.is_primary) || product.product_images[0];
      
      // Send primary image
      const primaryImageResponse = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: GROUP_CHAT_ID,
            photo: primaryImage.url,
            caption: '📸 Основное фото'
          })
        }
      )
      
      const primaryImageResult = await primaryImageResponse.json()
      console.log('Primary image response:', primaryImageResult)
      
      if (!primaryImageResponse.ok) {
        console.error('Warning: Failed to send primary image:', primaryImageResult)
      }

      // Then send the rest of the images as a group (excluding the primary image)
      const remainingImages = product.product_images.filter((img: any) => img.url !== primaryImage.url);
      
      if (remainingImages.length > 0) {
        console.log(`Sending ${remainingImages.length} additional images to Telegram`)
        
        const media = remainingImages.map((image: any) => ({
          type: 'photo',
          media: image.url
        }));

        // Send up to 9 additional images maximum (10 total with primary)
        const mediaToSend = media.slice(0, 9);
        
        const mediaResponse = await fetch(
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
        
        const mediaResult = await mediaResponse.json()
        console.log('Telegram media API response:', mediaResult)
        
        if (!mediaResponse.ok) {
          console.error('Warning: Failed to send additional images:', mediaResult)
        }
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
