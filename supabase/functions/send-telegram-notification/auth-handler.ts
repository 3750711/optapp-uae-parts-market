// Telegram authentication handler
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.168.0/node/crypto.ts";

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Validate incoming Telegram data
function validateTelegramData(data: any): data is TelegramAuthData {
  if (!data || typeof data !== 'object') {
    console.error('Invalid data: not an object');
    return false;
  }

  // Handle both string and number types for id (Telegram can send as string)
  const id = typeof data.id === 'string' ? parseInt(data.id) : data.id;
  if (typeof id !== 'number' || id <= 0 || isNaN(id)) {
    console.error('Invalid data: id must be a positive number, got:', data.id, typeof data.id);
    return false;
  }

  if (typeof data.first_name !== 'string' || data.first_name.trim().length === 0) {
    console.error('Invalid data: first_name must be a non-empty string');
    return false;
  }

  if (typeof data.auth_date !== 'number' || data.auth_date <= 0) {
    console.error('Invalid data: auth_date must be a positive number');
    return false;
  }

  if (typeof data.hash !== 'string' || data.hash.length === 0) {
    console.error('Invalid data: hash must be a non-empty string');
    return false;
  }

  // Optional fields validation
  if (data.username && (typeof data.username !== 'string' || data.username.trim().length === 0)) {
    console.error('Invalid data: username must be a non-empty string if provided');
    return false;
  }

  if (data.photo_url && (typeof data.photo_url !== 'string' || !data.photo_url.startsWith('http'))) {
    console.error('Invalid data: photo_url must be a valid URL if provided');
    return false;
  }

  return true;
}

// Verify Telegram Login Widget data
function verifyTelegramAuth(authData: TelegramAuthData, botToken: string): boolean {
  const { hash, ...data } = authData;
  
  // Create check string from data
  const checkString = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key as keyof typeof data]}`)
    .join('\n');
  
  // Create secret key from bot token
  const secretKey = createHash('sha256').update(botToken).digest();
  
  // Create hash from check string
  const calculatedHash = createHash('hmac-sha256', secretKey)
    .update(checkString)
    .digest('hex');
  
  return calculatedHash === hash;
}

export async function handleTelegramAuth(
  telegramData: any,
  supabaseClient: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    console.log('=== STARTING TELEGRAM AUTHENTICATION ===');
    console.log('Raw incoming data:', telegramData);
    
    // Validate incoming data structure
    if (!validateTelegramData(telegramData)) {
      console.error('Validation failed for incoming Telegram data');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid authentication data format',
          details: 'Required fields missing or invalid types'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }
    
    console.log('Validated Telegram data:', {
      id: telegramData.id,
      first_name: telegramData.first_name,
      username: telegramData.username,
      photo_url: telegramData.photo_url,
      auth_date: telegramData.auth_date,
      hash_provided: telegramData.hash ? 'yes' : 'no'
    });
    
    // Get required secrets from environment
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN environment variable not found!');
      return new Response(
        JSON.stringify({ 
          error: 'TELEGRAM_BOT_TOKEN not configured',
          details: 'Please add TELEGRAM_BOT_TOKEN to Edge Function secrets',
          missing_secret: 'TELEGRAM_BOT_TOKEN'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }
    
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY environment variable not found!');
      return new Response(
        JSON.stringify({ 
          error: 'SUPABASE_SERVICE_ROLE_KEY not configured',
          details: 'Please add SUPABASE_SERVICE_ROLE_KEY to Edge Function secrets',
          missing_secret: 'SUPABASE_SERVICE_ROLE_KEY'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }
    
    console.log('Both required secrets found');
    
    // Create admin client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Verify Telegram signature for security
    if (!verifyTelegramAuth(telegramData, botToken)) {
      console.error('Telegram signature verification failed');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid Telegram signature',
          details: 'Authentication data integrity check failed'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }
    
    console.log('✅ Telegram signature verification passed');
    
    // Convert telegram_id to proper type
    const telegramId = typeof telegramData.id === 'string' ? parseInt(telegramData.id) : telegramData.id;
    console.log('Processed telegram_id:', telegramId);
    
    // Check if user already exists by telegram_id
    console.log('Checking for existing user with telegram_id:', telegramId);
    const { data: existingProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, email, profile_completed')
      .eq('telegram_id', telegramId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking existing profile:', profileError);
      return new Response(
        JSON.stringify({ 
          error: 'Database error',
          details: profileError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }
    
    let authUser;
    let isNewUser = false;
    
    if (existingProfile) {
      console.log('Found existing profile:', existingProfile.id);
      
      // Get auth user
      const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(existingProfile.id);
      
      if (userError || !userData.user) {
        console.error('Error getting auth user:', userError);
        return new Response(
          JSON.stringify({ 
            error: 'User retrieval failed',
            details: userError?.message || 'User not found in auth system'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500 
          }
        );
      }
      
      authUser = userData.user;
      
      // Update telegram data in profile
      await adminClient
        .from('profiles')
        .update({
          telegram_username: telegramData.username,
          telegram_first_name: telegramData.first_name,
          telegram_photo_url: telegramData.photo_url
        })
        .eq('id', existingProfile.id);
      
    } else {
      console.log('Creating new user for telegram_id:', telegramId);
      isNewUser = true;
      
      // Create new auth user
      const tempEmail = `telegram_${telegramId}@telegram.local`;
      const tempPassword = crypto.randomUUID();
      
      const { data: newUserData, error: createError } = await adminClient.auth.admin.createUser({
        email: tempEmail,
        password: tempPassword,
        user_metadata: {
          telegram_id: telegramId,
          telegram_username: telegramData.username,
          telegram_first_name: telegramData.first_name,
          auth_method: 'telegram'
        },
        email_confirm: true
      });
      
      if (createError || !newUserData.user) {
        console.error('Error creating auth user:', createError);
        return new Response(
          JSON.stringify({ 
            error: 'User creation failed',
            details: createError?.message || 'Failed to create user'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500 
          }
        );
      }
      
      authUser = newUserData.user;
      console.log('Created new auth user:', authUser.id);
      
      // Create profile (this will be handled by the trigger)
      const { error: profileCreateError } = await adminClient
        .from('profiles')
        .insert({
          id: authUser.id,
          email: tempEmail,
          telegram_id: telegramId,
          telegram_username: telegramData.username,
          telegram_first_name: telegramData.first_name,
          telegram_photo_url: telegramData.photo_url,
          auth_method: 'telegram',
          profile_completed: false
        });
      
      if (profileCreateError) {
        console.error('Error creating profile:', profileCreateError);
        // Try to clean up auth user
        await adminClient.auth.admin.deleteUser(authUser.id);
        return new Response(
          JSON.stringify({ 
            error: 'Profile creation failed',
            details: profileCreateError.message
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500 
          }
        );
      }
    }
    
    // Generate session tokens
    console.log('Generating session for user:', authUser.id);
    const { data: sessionData, error: sessionError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: authUser.email
    });
    
    if (sessionError || !sessionData.properties) {
      console.error('Error generating session:', sessionError);
      return new Response(
        JSON.stringify({ 
          error: 'Session generation failed',
          details: sessionError?.message || 'Failed to generate session tokens'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }
    
    const response = {
      success: true,
      user_id: authUser.id,
      user_exists: !isNewUser,
      profile_completed: existingProfile?.profile_completed ?? false,
      access_token: sessionData.properties.access_token,
      refresh_token: sessionData.properties.refresh_token,
      user: {
        id: authUser.id,
        email: authUser.email,
        telegram_id: telegramId,
        telegram_username: telegramData.username,
        telegram_first_name: telegramData.first_name
      }
    };
    
    console.log('=== TELEGRAM AUTHENTICATION SUCCESSFUL ===');
    console.log('Response created for user:', authUser.id, 'isNewUser:', isNewUser);
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
    
  } catch (error) {
    console.error('=== TELEGRAM AUTHENTICATION ERROR ===');
    console.error('Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error type'
    });
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error?.message || 'An unexpected error occurred during authentication',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
        status: 500
      }
    );
  }
}