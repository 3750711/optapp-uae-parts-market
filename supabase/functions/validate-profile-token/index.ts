import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  console.log('validate-profile-token function called')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration')
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.49.4')
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { token } = await req.json()
    
    if (!token) {
      console.log('No token provided')
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Token is required' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Validating profile token:', token)
    console.log('Current time check:', new Date().toISOString())

    // First, get the profile without time filtering to check existence and time separately
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, company_name, user_type, public_share_enabled, public_share_expires_at')
      .eq('public_share_token', token)
      .maybeSingle()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Database error' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!profile) {
      console.log('Token not found in database')
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Invalid token' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if sharing is enabled
    if (!profile.public_share_enabled) {
      console.log('Public sharing disabled for profile:', profile.id)
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Public sharing disabled' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check expiration time
    const expiresAt = new Date(profile.public_share_expires_at)
    const now = new Date()
    console.log('Token expires at:', expiresAt.toISOString())
    console.log('Current time:', now.toISOString())
    console.log('Is expired:', now >= expiresAt)

    if (now >= expiresAt) {
      console.log('Token expired for profile:', profile.id)
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Token expired' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Valid token for profile:', profile.id)

    return new Response(
      JSON.stringify({
        valid: true,
        profile: {
          id: profile.id,
          full_name: profile.full_name,
          company_name: profile.company_name,
          user_type: profile.user_type,
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})