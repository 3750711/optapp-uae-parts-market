import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuration
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Utility functions
function sanitizeUsername(username: string): string {
  return username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

function sanitizeName(name: string): string {
  return name.replace(/[<>]/g, '').trim();
}

function generateEmailFromTelegram(telegramData: TelegramAuthData): string {
  const telegramId = telegramData.id;
  
  if (telegramData.username && telegramData.username.trim().length > 0) {
    const cleanUsername = sanitizeUsername(telegramData.username);
    if (cleanUsername.length >= 3) {
      return `${cleanUsername}.${telegramId}@telegram.partsbay.ae`;
    }
  }
  
  if (telegramData.first_name && telegramData.first_name.trim().length > 0) {
    const cleanFirstName = sanitizeUsername(telegramData.first_name);
    if (cleanFirstName.length >= 2) {
      return `${cleanFirstName}.${telegramId}@telegram.partsbay.ae`;
    }
  }
  
  return `user.${telegramId}@telegram.partsbay.ae`;
}

function generateFullName(telegramData: TelegramAuthData): string {
  const firstName = telegramData.first_name ? sanitizeName(telegramData.first_name) : '';
  const lastName = telegramData.last_name ? sanitizeName(telegramData.last_name) : '';
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  }
  
  return 'Telegram User';
}

// Validate incoming Telegram data
function validateTelegramData(data: any): data is TelegramAuthData {
  if (!data || typeof data !== 'object') {
    console.error('Invalid data: not an object');
    return false;
  }

  const id = typeof data.id === 'string' ? parseInt(data.id) : data.id;
  if (typeof id !== 'number' || id <= 0 || isNaN(id)) {
    console.error('Invalid data: id must be a positive number');
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

  return true;
}

// Verify Telegram signature
async function verifyTelegramAuth(authData: TelegramAuthData, botToken: string): Promise<boolean> {
  try {
    console.log('Starting signature verification...');
    
    if (!botToken) {
      console.error('Bot token is missing');
      return false;
    }

    const { hash, ...data } = authData;
    
    // Check auth_date (must be within 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const authTime = data.auth_date;
    const timeDiff = currentTime - authTime;
    
    if (timeDiff > 300) { // 5 minutes
      console.error('Auth data too old');
      return false;
    }
    
    // Create check string from data
    const checkString = Object.keys(data)
      .sort()
      .map(key => `${key}=${data[key as keyof typeof data]}`)
      .join('\n');
    
    console.log('Check string for verification:', checkString);
    
    // Use Deno's built-in crypto module
    const encoder = new TextEncoder();
    const tokenBytes = encoder.encode(botToken);
    
    // First, get SHA-256 hash of the bot token
    const secretKey = await crypto.subtle.digest('SHA-256', tokenBytes);
    
    // Create HMAC key
    const key = await crypto.subtle.importKey(
      'raw',
      secretKey,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Calculate HMAC
    const checkStringBytes = encoder.encode(checkString);
    const signature = await crypto.subtle.sign('HMAC', key, checkStringBytes);
    
    // Convert to hex string
    const calculatedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    console.log('Calculated hash:', calculatedHash);
    console.log('Provided hash:', hash);
    
    const isValid = calculatedHash === hash;
    console.log('Signature verification result:', isValid);
    
    return isValid;
  } catch (error) {
    console.error('Error in Telegram signature verification:', error);
    return false;
  }
}

async function handleTelegramCompleteAuth(telegramData: any): Promise<Response> {
  try {
    console.log('=== STARTING TELEGRAM COMPLETE AUTH ===');
    console.log('Function called at:', new Date().toISOString());
    
    // Validate incoming data
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
    
    // Check required environment variables
    if (!BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN not found');
      return new Response(
        JSON.stringify({ 
          error: 'TELEGRAM_BOT_TOKEN not configured'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }

    if (!SERVICE_ROLE_KEY) {
      console.error('SERVICE_ROLE_KEY not found');
      return new Response(
        JSON.stringify({ 
          error: 'SERVICE_ROLE_KEY not configured. This is required for Telegram authentication.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }
    
    // Verify Telegram signature
    console.log('Verifying Telegram signature...');
    const isValidSignature = await verifyTelegramAuth(telegramData, BOT_TOKEN);
    
    if (!isValidSignature) {
      console.error('Telegram signature verification failed');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid Telegram signature'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }
    
    console.log('✅ Telegram signature verification passed');
    
    // Create Supabase admin client
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const telegramId = typeof telegramData.id === 'string' ? parseInt(telegramData.id) : telegramData.id;
    console.log('Processing telegram_id:', telegramId);
    
    // Generate user data
    const email = generateEmailFromTelegram(telegramData);
    const fullName = generateFullName(telegramData);
    
    console.log('Generated email:', email);
    console.log('Generated full name:', fullName);
    
    // Check if user exists by telegram_id first
    console.log('Checking for existing user by telegram_id...');
    const { data: existingProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, email, profile_completed, full_name, avatar_url, user_type')
      .eq('telegram_id', telegramId)
      .maybeSingle();
    
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
    
    let user;
    let authResult;
    
    if (existingProfile) {
      console.log('🔍 Found existing user by telegram_id:', existingProfile.id);
      
      // Get the auth user
      const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(existingProfile.id);
      
      if (authError || !authUser.user) {
        console.error('Error getting auth user:', authError);
        return new Response(
          JSON.stringify({ 
            error: 'User auth data not found',
            details: authError?.message
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500 
          }
        );
      }
      
      user = authUser.user;
      
      // Update profile with latest Telegram data
      await adminClient
        .from('profiles')
        .update({
          telegram_username: telegramData.username,
          telegram_first_name: telegramData.first_name,
          telegram_photo_url: telegramData.photo_url,
          avatar_url: telegramData.photo_url || existingProfile.avatar_url,
          full_name: fullName || existingProfile.full_name
        })
        .eq('id', existingProfile.id);
      
    } else {
      console.log('Checking if user exists by email...');
      
      // Check if user exists by email in auth.users
      let existingAuthUser = null;
      try {
        const { data: authUserData, error: authUserError } = await adminClient.auth.admin.getUserByEmail(email);
        if (!authUserError && authUserData) {
          existingAuthUser = authUserData.user;
        }
      } catch (error) {
        console.log('User not found by email, will create new user');
      }
      
      if (existingAuthUser) {
        console.log('🔍 Found existing auth user by email:', existingAuthUser.id);
        
        user = existingAuthUser;
        
        // Check if profile exists for this auth user
        const { data: userProfile, error: userProfileError } = await adminClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (!userProfile && (!userProfileError || userProfileError.code === 'PGRST116')) {
          // Profile doesn't exist, create it
          console.log('Creating missing profile for existing auth user');
          const { error: insertError } = await adminClient
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: fullName,
              auth_method: 'telegram',
              profile_completed: true,
              telegram_id: telegramId,
              telegram_username: telegramData.username,
              telegram_first_name: telegramData.first_name,
              telegram_photo_url: telegramData.photo_url,
              avatar_url: telegramData.photo_url
            });

          if (insertError) {
            console.error('Error creating profile:', insertError);
          }
        } else if (userProfile) {
          // Update existing profile with Telegram data
          console.log('Updating existing profile with Telegram data');
          await adminClient
            .from('profiles')
            .update({
              auth_method: 'telegram',
              telegram_id: telegramId,
              telegram_username: telegramData.username,
              telegram_first_name: telegramData.first_name,
              telegram_photo_url: telegramData.photo_url,
              avatar_url: telegramData.photo_url || userProfile.avatar_url,
              full_name: fullName || userProfile.full_name
            })
            .eq('id', user.id);
        }
        
      } else {
        console.log('🆕 Creating new user...');
        
        // Create new user using admin client
        const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
          email: email,
          email_confirm: true,
          user_metadata: {
            auth_method: 'telegram',
            telegram_id: telegramId,
            telegram_username: telegramData.username,
            telegram_first_name: telegramData.first_name,
            telegram_last_name: telegramData.last_name,
            photo_url: telegramData.photo_url,
            full_name: fullName,
            user_type: 'buyer'
          }
        });
        
        if (userError) {
          console.error('Error creating new user:', userError);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to create user account',
              details: userError.message
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 400 
            }
          );
        }
        
        user = userData.user;
        console.log('✅ User created successfully:', user.id);
      }
    }
    
    // Generate session using magic link
    console.log('Generating magic link for user:', user.id);
    
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!
    });
    
    if (linkError) {
      console.error('Error generating magic link:', linkError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create session',
          details: linkError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }
    
    authResult = {
      success: true,
      access_token: linkData.properties?.access_token,
      refresh_token: linkData.properties?.refresh_token,
      user_data: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata || user.raw_user_meta_data
      }
    };
    
    console.log('✅ Telegram authentication completed successfully');
    
    return new Response(
      JSON.stringify(authResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('=== TELEGRAM COMPLETE AUTH ERROR ===');
    console.error('Error details:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error?.message || 'An unexpected error occurred',
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

console.log('🚀 Telegram Complete Auth Function starting up...');
console.log('Environment check:');
console.log('- SUPABASE_URL:', !!SUPABASE_URL);
console.log('- SUPABASE_ANON_KEY:', !!Deno.env.get('SUPABASE_ANON_KEY'));
console.log('- SERVICE_ROLE_KEY:', !!SERVICE_ROLE_KEY);
console.log('- TELEGRAM_BOT_TOKEN:', !!BOT_TOKEN);

serve(async (req) => {
  console.log('=== TELEGRAM COMPLETE AUTH FUNCTION CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const reqData = await req.json();
    console.log('Received request data:', reqData);

    return await handleTelegramCompleteAuth(reqData);
  } catch (error) {
    console.error('=== TELEGRAM COMPLETE AUTH FUNCTION ERROR ===');
    console.error('Error details:', error);

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error?.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});