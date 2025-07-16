import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple interface for Telegram data
interface SimpleTelegramData {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

serve(async (req) => {
  console.log('=== SIMPLE TELEGRAM AUTH CALLED ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const requestData = await req.json()
    console.log('📦 Received data:', JSON.stringify(requestData, null, 2))

    // Basic validation - just check required fields exist
    if (!requestData.id || !requestData.auth_date || !requestData.hash) {
      console.log('❌ Missing required fields')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    // Convert to our interface
    const telegramData: SimpleTelegramData = {
      id: Number(requestData.id),
      first_name: requestData.first_name || '',
      last_name: requestData.last_name || '',
      username: requestData.username || '',
      photo_url: requestData.photo_url || '',
      auth_date: Number(requestData.auth_date),
      hash: requestData.hash
    }

    console.log('🔄 Converted data:', JSON.stringify(telegramData, null, 2))

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SERVICE_ROLE_KEY')!
    
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('🔍 Looking for existing user by telegram_id:', telegramData.id)

    // Check if user exists by telegram_id
    const { data: existingProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('telegram_id', telegramData.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.log('❌ Database error:', profileError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database error' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    let user
    let email
    let password

    if (existingProfile) {
      console.log('✅ Found existing user:', existingProfile.id)
      user = existingProfile
      email = existingProfile.email
      password = `tg_${telegramData.id}_simple`
    } else {
      console.log('🆕 Creating new user...')
      
      // Generate email and password
      email = `telegram_${telegramData.id}@partsbay.ae`
      password = `tg_${telegramData.id}_simple`
      
      console.log('📧 Generated email:', email)

      // First check if auth user already exists by email
      const { data: existingAuthUser, error: listError } = await adminClient.auth.admin.listUsers()
      
      if (listError) {
        console.log('⚠️ Could not check existing auth users:', listError)
      }
      
      const authUserExists = existingAuthUser?.users?.find(u => u.email === email)
      
      if (authUserExists) {
        console.log('🔗 Found existing auth user without profile, linking...')
        
        // Create profile for existing auth user
        const { data: profile, error: insertError } = await adminClient
          .from('profiles')
          .insert({
            id: authUserExists.id,
            email: email,
            telegram_id: telegramData.id,
            telegram_first_name: telegramData.first_name,
            telegram_last_name: telegramData.last_name,
            telegram_username: telegramData.username,
            telegram_photo_url: telegramData.photo_url,
            full_name: `${telegramData.first_name || ''} ${telegramData.last_name || ''}`.trim() || telegramData.username || `User${telegramData.id}`,
            user_type: 'buyer',
            auth_method: 'telegram'
          })
          .select()
          .single()

        if (insertError) {
          console.log('❌ Profile creation error for existing auth user:', insertError)
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Failed to create profile for existing user' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 500 
            }
          )
        }

        console.log('✅ Profile created for existing auth user:', profile.id)
        user = profile
      } else {
        // Create completely new auth user
        const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: {
            telegram_id: telegramData.id,
            telegram_first_name: telegramData.first_name,
            telegram_username: telegramData.username,
            auth_method: 'telegram'
          }
        })

        if (authError) {
          console.log('❌ Auth creation error:', authError)
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Failed to create user' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 500 
            }
          )
        }

        console.log('✅ Auth user created:', authUser.user.id)

        // Create profile for new auth user
        const { data: profile, error: insertError } = await adminClient
          .from('profiles')
          .insert({
            id: authUser.user.id,
            email: email,
            telegram_id: telegramData.id,
            telegram_first_name: telegramData.first_name,
            telegram_last_name: telegramData.last_name,
            telegram_username: telegramData.username,
            telegram_photo_url: telegramData.photo_url,
            full_name: `${telegramData.first_name || ''} ${telegramData.last_name || ''}`.trim() || telegramData.username || `User${telegramData.id}`,
            user_type: 'buyer',
            auth_method: 'telegram'
          })
          .select()
          .single()

        if (insertError) {
          console.log('❌ Profile creation error:', insertError)
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Failed to create profile' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 500 
            }
          )
        }

        console.log('✅ Profile created:', profile.id)
        user = profile
      }
    }

    // For existing users, update password to ensure consistency
    if (existingProfile) {
      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        existingProfile.id,
        { password: password }
      )
      
      if (updateError) {
        console.log('⚠️ Password update warning:', updateError)
        // Continue anyway - might still work
      } else {
        console.log('✅ Password updated for existing user')
      }
    }

    const result = {
      success: true,
      email: email,
      password: password,
      user: {
        id: user.id,
        email: email,
        full_name: user.full_name,
        telegram_data: {
          id: telegramData.id,
          first_name: telegramData.first_name,
          username: telegramData.username,
          photo_url: telegramData.photo_url
        }
      }
    }

    console.log('✅ Success! Returning result')
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )

  } catch (error) {
    console.log('💥 Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})