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
    
    console.log('=== Telegram Widget Auth Request ===')
    console.log('Auth data received:', JSON.stringify(authData, null, 2))

    // Get bot token from environment
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured')
      throw new Error('TELEGRAM_BOT_TOKEN not configured')
    }
    console.log('Bot token exists:', !!botToken)

    // Verify auth data using Telegram's official algorithm
    const isValid = await verifyTelegramAuth(authData, botToken)
    console.log('Auth verification result:', isValid)
    
    if (!isValid) {
      console.error('Invalid Telegram authentication data')
      return new Response(
        JSON.stringify({ error: 'Invalid Telegram authentication data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if auth_date is not too old (5 minutes)
    const currentTime = Math.floor(Date.now() / 1000)
    const timeDiff = currentTime - authData.auth_date
    console.log('Time difference (seconds):', timeDiff)
    
    if (timeDiff > 300) {
      console.error('Authentication data is too old:', timeDiff, 'seconds')
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
    console.log('Checking for existing user with telegram_id:', authData.id)
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
      console.log('Existing user found:', { userId, email })
    } else {
      // Create new user
      console.log('Creating new user for telegram_id:', authData.id)
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
      console.log('New user created:', { userId, email })

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
    }

    // Generate access token for the user using admin API
    console.log('Generating access token for user:', userId)
    const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateAccessToken(userId)

    if (tokenError) {
      console.error('Error generating access token:', tokenError)
      throw tokenError
    }

    console.log('Access token generated successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== Error in telegram auth ===')
    console.error('Error details:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Verify Telegram authentication data according to official Telegram documentation
 * https://core.telegram.org/widgets/login#checking-authorization
 */
async function verifyTelegramAuth(authData: TelegramAuthData, botToken: string): Promise<boolean> {
  try {
    console.log('=== Starting Telegram Auth Verification ===')
    
    const { hash, ...dataToCheck } = authData
    console.log('Hash from Telegram:', hash)
    console.log('Data to check:', dataToCheck)
    
    // Step 1: Create data_check_string according to Telegram spec
    // Sort keys alphabetically and join with "&" (not "\n")
    const dataCheckString = Object.keys(dataToCheck)
      .sort()
      .map(key => `${key}=${dataToCheck[key as keyof typeof dataToCheck]}`)
      .join('&')  // FIXED: Use & instead of \n
    
    console.log('Data check string:', dataCheckString)
    
    // Step 2: Create secret key using two-step HMAC according to Telegram spec
    const encoder = new TextEncoder()
    
    // First HMAC: HMAC-SHA256(bot_token, "WebAppData")
    const webAppDataKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const secretKeyData = await crypto.subtle.sign('HMAC', webAppDataKey, encoder.encode(botToken))
    
    // Second HMAC: Use the result as the key for the actual verification
    const secretKey = await crypto.subtle.importKey(
      'raw',
      secretKeyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    console.log('Secret key created successfully')
    
    // Step 3: Create HMAC signature of data_check_string
    const signature = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(dataCheckString))
    const hashArray = Array.from(new Uint8Array(signature))
    const calculatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    console.log('Calculated hash:', calculatedHash)
    console.log('Expected hash:', hash)
    console.log('Hashes match:', calculatedHash === hash)
    
    return calculatedHash === hash
    
  } catch (error) {
    console.error('Error in verifyTelegramAuth:', error)
    return false
  }
}