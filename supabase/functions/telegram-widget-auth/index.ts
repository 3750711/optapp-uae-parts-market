import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TelegramAuthData {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { authData }: { authData: TelegramAuthData } = await req.json()
    
    console.log('Telegram auth request received:', { id: authData.id, username: authData.username })

    // Get bot token from environment
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured')
    }

    // Verify auth data
    const isValid = await verifyTelegramAuth(authData, botToken)
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid Telegram authentication data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if auth_date is not too old (5 minutes)
    const currentTime = Math.floor(Date.now() / 1000)
    if (currentTime - authData.auth_date > 300) {
      return new Response(
        JSON.stringify({ error: 'Authentication data is too old' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if user exists by telegram_id
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('telegram_id', authData.id)
      .single()

    let userId: string
    let email: string

    if (existingProfile) {
      // User exists, use their ID
      userId = existingProfile.id
      email = existingProfile.email
      console.log('Existing user found:', userId)
    } else {
      // Create new user
      const tempEmail = `telegram_${authData.id}@temp.telegram`
      const tempPassword = crypto.randomUUID()

      const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
        email: tempEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          auth_method: 'telegram',
          telegram_id: authData.id,
          telegram_username: authData.username,
          telegram_first_name: authData.first_name,
          telegram_last_name: authData.last_name,
          photo_url: authData.photo_url,
          full_name: `${authData.first_name} ${authData.last_name || ''}`.trim()
        }
      })

      if (signUpError) {
        console.error('Error creating user:', signUpError)
        throw signUpError
      }

      userId = newUser.user.id
      email = tempEmail

      // Update profile with telegram_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          telegram_id: authData.id,
          auth_method: 'telegram',
          full_name: `${authData.first_name} ${authData.last_name || ''}`.trim(),
          avatar_url: authData.photo_url,
          profile_completed: false
        })
        .eq('id', userId)

      if (profileError) {
        console.error('Error updating profile:', profileError)
        throw profileError
      }

      console.log('New user created:', userId)
    }

    // Generate session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('//', '//').replace('supabase.co', 'supabase.co')}`
      }
    })

    if (sessionError) {
      console.error('Error generating session:', sessionError)
      throw sessionError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId,
        accessToken: sessionData.properties?.access_token,
        refreshToken: sessionData.properties?.refresh_token
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in telegram auth:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function verifyTelegramAuth(authData: TelegramAuthData, botToken: string): Promise<boolean> {
  const { hash, ...dataToCheck } = authData
  
  // Create data string for verification
  const dataCheckString = Object.keys(dataToCheck)
    .sort()
    .map(key => `${key}=${dataToCheck[key as keyof typeof dataToCheck]}`)
    .join('\n')

  // Create secret key
  const encoder = new TextEncoder()
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(botToken),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // Create HMAC
  const signature = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(dataCheckString))
  const hashArray = Array.from(new Uint8Array(signature))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return hashHex === hash
}