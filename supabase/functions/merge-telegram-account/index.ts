import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

interface MergeAccountRequest {
  existing_email: string
  password: string
  telegram_data: {
    id: number
    first_name: string
    last_name?: string
    username?: string
    photo_url?: string
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== Merge Account Request ===')
    
    const { existing_email, password, telegram_data }: MergeAccountRequest = await req.json()
    
    if (!existing_email || !password || !telegram_data) {
      throw new Error('Missing required parameters')
    }

    console.log('Attempting to merge account for email:', existing_email)
    console.log('Telegram data:', telegram_data)

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // First, verify the password by attempting to sign in
    console.log('Verifying password for email:', existing_email)
    
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: existing_email,
      password: password
    })

    if (signInError) {
      console.log('Password verification failed:', signInError.message)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Неверный пароль от существующего аккаунта' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Password verified successfully for user:', authData.user.id)

    // Check if telegram_id is already taken
    const { data: existingTelegramUser } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('telegram_id', telegram_data.id)
      .maybeSingle()

    if (existingTelegramUser && existingTelegramUser.id !== authData.user.id) {
      console.log('Telegram ID already exists for different user')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Этот Telegram аккаунт уже привязан к другому пользователю' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the existing profile with Telegram data
    console.log('Updating profile with Telegram data for user:', authData.user.id)
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        telegram_id: telegram_data.id,
        auth_method: 'telegram',
        full_name: `${telegram_data.first_name} ${telegram_data.last_name || ''}`.trim(),
        avatar_url: telegram_data.photo_url,
        telegram: normalizeTelegramUsername(telegram_data.username),
        email_confirmed: true // Will be handled by our trigger
      })
      .eq('id', authData.user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      throw new Error('Ошибка при обновлении профиля')
    }

    console.log('Account merged successfully')

    // Generate temporary password for immediate login
    const tempPassword = crypto.randomUUID()
    
    // Update auth user password
    const { error: passwordUpdateError } = await supabase.auth.admin.updateUserById(
      authData.user.id,
      { password: tempPassword }
    )

    if (passwordUpdateError) {
      console.error('Error updating password:', passwordUpdateError)
      throw new Error('Ошибка при обновлении пароля')
    }

    // Sign out the verification session
    await supabase.auth.signOut()

    return new Response(
      JSON.stringify({ 
        success: true,
        email: existing_email,
        password: tempPassword,
        message: 'Аккаунты успешно объединены'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== Error in account merge ===')
    console.error('Error details:', error)
    console.error('Error message:', error.message)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Ошибка при объединении аккаунтов' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})