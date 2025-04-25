
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST',
      }
    })
  }

  try {
    const { userId, status, telegram, userType } = await req.json()

    // Validate input
    if (!userId || !status || !telegram) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Customize message based on user type and status
    let message = '';
    if (userType === 'buyer') {
      message = status === 'verified' 
        ? '✅ Ваш аккаунт покупателя был подтвержден!' 
        : status === 'pending'
        ? '⏳ Статус вашего аккаунта покупателя изменен на ожидание подтверждения.'
        : '🚫 Ваш аккаунт покупателя был заблокирован.';
    } else if (userType === 'seller') {
      message = status === 'verified' 
        ? '✅ Ваш аккаунт продавца был подтвержден!' 
        : status === 'pending'
        ? '⏳ Статус вашего аккаунта продавца изменен на ожидание подтверждения.'
        : '🚫 Ваш аккаунт продавца был заблокирован.';
    }

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegram.replace('@', ''),
          text: message
        })
      }
    )

    const result = await telegramResponse.json()
    console.log('Telegram notification sent:', result);

    return new Response(JSON.stringify(result), {
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
