import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logTelegramNotification } from '../shared/telegram-logger.ts';

/**
 * Normalizes a Telegram username by adding @ prefix if missing
 */
function normalizeTelegramUsername(username: string | null | undefined): string {
  if (!username) return '';
  
  const trimmed = username.trim();
  if (!trimmed) return '';
  
  // Remove @ from the beginning if present, then add it back to ensure consistency
  const withoutAt = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
  
  return `@${withoutAt}`;
}

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
    console.log('=== Request received ===')
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    
    const body = await req.text()
    console.log('Raw request body:', body)
    
    let authData: TelegramAuthData
    try {
      const parsed = JSON.parse(body)
      authData = parsed.authData
      console.log('Parsed authData:', JSON.stringify(authData, null, 2))
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      throw new Error('Invalid JSON in request body')
    }
    
    if (!authData) {
      throw new Error('No authData in request')
    }

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

    // Step 1: Check if user exists by telegram_id first
    console.log('🔍 Searching for existing user by telegram_id:', authData.id)
    const { data: existingTelegramProfile } = await supabase
      .from('profiles')
      .select('id, email, telegram_id, telegram, auth_method')
      .eq('telegram_id', authData.id)
      .maybeSingle()

    console.log('📊 Search by telegram_id result:', {
      found: !!existingTelegramProfile,
      user_id: existingTelegramProfile?.id,
      email: existingTelegramProfile?.email,
      telegram_id: existingTelegramProfile?.telegram_id
    })

    // Step 2: If not found by telegram_id, check by telegram username (for account merging)
    let existingUsernameProfile = null
    if (!existingTelegramProfile && authData.username) {
      const normalizedUsername = normalizeTelegramUsername(authData.username)
      console.log('🔍 Searching for existing user by telegram username:', normalizedUsername)
      
      const { data: usernameProfile } = await supabase
        .from('profiles')
        .select('id, email, telegram_id, telegram, auth_method')
        .eq('telegram', normalizedUsername)
        .is('telegram_id', null) // Only accounts without telegram_id (email-based)
        .maybeSingle()
      
      console.log('📊 Search by telegram username result:', {
        found: !!usernameProfile,
        user_id: usernameProfile?.id,
        email: usernameProfile?.email,
        auth_method: usernameProfile?.auth_method,
        has_telegram_id: !!usernameProfile?.telegram_id
      })
      
      existingUsernameProfile = usernameProfile
    }

    let email: string
    let tempPassword: string
    let isNewUser = false

    if (existingTelegramProfile) {
      // User already has Telegram account linked
      email = existingTelegramProfile.email
      tempPassword = crypto.randomUUID()
      console.log('✅ Existing Telegram user found, updating password for login')
      
      // Update user password temporarily
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingTelegramProfile.id,
        { password: tempPassword }
      )
      
      if (updateError) {
        console.error('❌ Error updating user password:', updateError)
        throw updateError
      }
      
      // Update profile with latest Telegram data
      await supabase
        .from('profiles')
        .update({
          full_name: `${authData.first_name} ${authData.last_name || ''}`.trim(),
          avatar_url: authData.photo_url,
          telegram: normalizeTelegramUsername(authData.username)
        })
        .eq('id', existingTelegramProfile.id)
        
    } else if (existingUsernameProfile) {
      // Account merge required - existing email account with same telegram username but no telegram_id
      console.log('🔗 Found existing email account with matching telegram username - requesting account merge')
      
      return new Response(
        JSON.stringify({ 
          success: true,
          requires_merge: true,
          existing_email: existingUsernameProfile.email,
          telegram_data: {
            id: authData.id,
            first_name: authData.first_name,
            last_name: authData.last_name,
            username: normalizeTelegramUsername(authData.username),
            photo_url: authData.photo_url
          },
          merge_reason: 'telegram_username_match',
          message: 'Account with this Telegram username already exists. Please enter your account password to link.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      // New user - create with temp credentials
      email = `telegram${authData.id}@partsbay.temp`
      tempPassword = crypto.randomUUID()
      console.log('🆕 Creating new user for telegram_id:', authData.id)
      console.log('📧 Using email format:', email)

      const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          auth_method: 'telegram',
          telegram_id: String(authData.id), // Ensure string for metadata
          telegram: normalizeTelegramUsername(authData.username),
          photo_url: authData.photo_url,
          full_name: `${authData.first_name} ${authData.last_name || ''}`.trim(),
          profile_completed: false // Mark as incomplete for profile completion flow
        }
      })

      if (signUpError) {
        console.error('❌ Error creating user:', signUpError)
        throw signUpError
      }

      console.log('✅ New user created:', { userId: newUser.user.id, email })
      isNewUser = true
      
      // Note: Profile creation will be handled by database trigger
      // No need to manually create profile here to avoid conflicts
      console.log('📝 Profile will be created by database trigger')
      
      // Log telegram widget auth notification (wrapped in try-catch)
      try {
        console.log('📤 Attempting to log Telegram notification...')
        await logTelegramNotification(supabase, {
          function_name: 'telegram-widget-auth',
          notification_type: 'widget_registration',
          recipient_type: 'personal',
          recipient_identifier: authData.id.toString(),
          recipient_name: `${authData.first_name} ${authData.last_name || ''}`.trim(),
          message_text: 'New user registered via Telegram widget',
          status: 'sent',
          related_entity_type: 'user',
          related_entity_id: newUser.user.id,
          metadata: {
            telegram_username: normalizeTelegramUsername(authData.username),
            auth_method: 'telegram_widget',
            registration_time: new Date().toISOString()
          }
        });
        console.log('✅ Telegram notification logged successfully')
      } catch (logError) {
        console.error('⚠️ Failed to log telegram notification (non-critical):', logError);
        // Don't throw - notification logging is not critical for registration
      }
    }

    console.log('Returning credentials for client login')

    // Check if profile completion is required for new users
    let requiresProfileCompletion = false
    if (isNewUser) {
      requiresProfileCompletion = true
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        email,
        password: tempPassword,
        is_new_user: isNewUser,
        requires_profile_completion: requiresProfileCompletion
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