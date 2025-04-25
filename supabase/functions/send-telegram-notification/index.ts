
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')

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

    // First check if BOT_TOKEN is available
    if (!BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN environment variable is not set');
      return new Response(JSON.stringify({ error: 'Telegram bot token not configured' }), { 
        status: 500,
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

    // Clean telegram handle - remove @ if present
    const cleanTelegramHandle = telegram.replace('@', '');
    
    try {
      // Extract bot username for instructions, safely handle if format is unexpected
      let botInstructions = '';
      try {
        if (BOT_TOKEN.includes(':')) {
          const botUsername = BOT_TOKEN.split(':')[0];
          if (botUsername) {
            botInstructions = `\n\nЕсли вы еще не общались с нашим ботом, пожалуйста, найдите @${botUsername} в Telegram и отправьте ему сообщение /start.`;
          }
        }
      } catch (e) {
        console.error('Error extracting bot username:', e);
        botInstructions = '\n\nЕсли вы еще не получаете уведомления, пожалуйста, начните диалог с нашим ботом.';
      }
      
      message += botInstructions;

      // Send to Telegram API using chat_id (must be numeric ID, not username)
      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: cleanTelegramHandle,
            text: message
          })
        }
      )

      const result = await telegramResponse.json()
      console.log('Telegram notification sent:', result);

      // Detailed logging for debugging
      if (!result.ok) {
        console.error('Telegram API error:', result);
        
        if (result.description && result.description.includes('chat not found')) {
          // This is the most common error - user hasn't started a chat with the bot
          return new Response(JSON.stringify({ 
            error: 'Chat not found. User needs to start a conversation with the bot first.',
            telegramError: result 
          }), { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } catch (telegramError) {
      console.error('Error sending Telegram message:', telegramError);
      return new Response(JSON.stringify({ error: 'Telegram API error', details: telegramError.message }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    console.error('Telegram notification error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
