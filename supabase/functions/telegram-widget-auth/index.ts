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
      .select('id, email')
      .eq('telegram_id', authData.id)
      .single()

    let email: string
    let tempPassword: string
    const isNewUser = !existingProfile

    if (existingProfile) {
      // Existing user - generate new temp password for login
      email = existingProfile.email
      tempPassword = crypto.randomUUID()
      console.log('Existing user found, updating password for login')
      
      // Update user password temporarily
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingProfile.id,
        { password: tempPassword }
      )
      
      if (updateError) {
        console.error('Error updating user password:', updateError)
        throw updateError
      }
      
      // Update profile with latest Telegram data
      await supabase
        .from('profiles')
        .update({
          full_name: `${authData.first_name} ${authData.last_name || ''}`.trim(),
          avatar_url: authData.photo_url,
          telegram_username: authData.username,
          telegram_first_name: authData.first_name
        })
        .eq('id', existingProfile.id)
        
    } else {
      // New user - create with temp credentials
      email = `telegram_${authData.id}@temp.telegram`
      tempPassword = crypto.randomUUID()
      console.log('Creating new user for telegram_id:', authData.id)

      const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          auth_method: 'telegram',
          telegram_id: authData.id,
          telegram_username: authData.username,
          telegram_first_name: authData.first_name,
          photo_url: authData.photo_url,
          full_name: `${authData.first_name} ${authData.last_name || ''}`.trim()
        }
      })

      if (signUpError) {
        console.error('Error creating user:', signUpError)
        throw signUpError
      }

      console.log('New user created:', { userId: newUser.user.id, email })
    }

    console.log('Returning credentials for client login')

    return new Response(
      JSON.stringify({ 
        success: true, 
        email,
        password: tempPassword,
        is_new_user: isNewUser
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
    
    // Filter out empty values and create data_check_string according to Telegram Login Widget spec
    const dataCheckString = Object.entries(dataToCheck)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .sort()
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')  // Use \n as separator, not &
    
    console.log('Data check string:', dataCheckString)
    
    // For Telegram Login Widget: Create SHA-256 hash of bot token first
    const encoder = new TextEncoder()
    const secretKey = await crypto.subtle.digest('SHA-256', encoder.encode(botToken))
    
    // Use the SHA-256 hash as HMAC key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      secretKey,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    console.log('Secret key created successfully')
    
    // Calculate HMAC of the data_check_string with the SHA-256 hashed bot token
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(dataCheckString))
    const calculatedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    console.log('Calculated hash:', calculatedHash)
    console.log('Expected hash:', hash)
    console.log('Hashes match:', calculatedHash === hash)
    
    const result = calculatedHash === hash
    console.log('Auth verification result:', result)
    
    return result
  } catch (error) {
    console.error('Error in verifyTelegramAuth:', error)
    return false
  }
}