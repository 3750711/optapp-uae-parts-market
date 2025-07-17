import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Personal Telegram message function called')

    if (!BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN not configured')
      return new Response(
        JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN not configured' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    console.log('Auth header received:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Extract token properly
    const token = authHeader.replace('Bearer ', '').trim()
    console.log('Token extracted, length:', token.length)
    
    if (!token || token.length < 20) {
      console.error('Invalid token format or length')
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Create supabase client with user token for proper auth
    const supabaseWithAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )

    // Verify user session
    const { data: { user }, error: authError } = await supabaseWithAuth.auth.getUser(token)

    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'No user found')
      return new Response(
        JSON.stringify({ 
          error: 'Authentication failed',
          details: authError?.message || 'Invalid or expired token'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    console.log('User authenticated:', user.id)

    // Check admin permissions with service role client
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError.message)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to verify user permissions',
          details: profileError.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    if (!profile || profile.user_type !== 'admin') {
      console.error('Admin access denied for user:', user.id, 'type:', profile?.user_type)
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403 
        }
      )
    }

    console.log('Admin permissions verified for user:', user.id)

    const { user_id, message_text, images } = await req.json()

    if (!user_id || !message_text) {
      return new Response(
        JSON.stringify({ error: 'user_id and message_text are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Get user's telegram_id
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('telegram_id, full_name, email')
      .eq('id', user_id)
      .single()

    if (userError || !targetUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    if (!targetUser.telegram_id) {
      return new Response(
        JSON.stringify({ error: 'User does not have Telegram ID' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log(`Sending message to user ${targetUser.full_name} (${targetUser.telegram_id})`)

    // Send message via Telegram Bot API
    let telegramResponse
    
    if (images && images.length > 0) {
      // Send media group with message
      const mediaGroup = images.map((imageUrl: string, index: number) => ({
        type: 'photo',
        media: imageUrl,
        caption: index === 0 ? message_text : undefined
      }))

      telegramResponse = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetUser.telegram_id,
            media: mediaGroup
          })
        }
      )
    } else {
      // Send text message only
      telegramResponse = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetUser.telegram_id,
            text: message_text,
            parse_mode: 'HTML'
          })
        }
      )
    }

    const telegramResult = await telegramResponse.json()

    if (!telegramResponse.ok) {
      console.error('Telegram API error:', telegramResult)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send message via Telegram',
          details: telegramResult.description 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Log the action
    await supabase
      .from('event_logs')
      .insert({
        action_type: 'admin_telegram_message',
        entity_type: 'user',
        entity_id: user_id,
        user_id: user.id,
        details: {
          target_user: targetUser.full_name || targetUser.email,
          telegram_id: targetUser.telegram_id,
          message_length: message_text.length,
          images_count: images?.length || 0,
          telegram_message_id: telegramResult.result?.message_id || telegramResult.result?.[0]?.message_id
        }
      })

    console.log('Message sent successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message sent successfully',
        telegram_result: telegramResult.result
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in send-personal-telegram-message function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})