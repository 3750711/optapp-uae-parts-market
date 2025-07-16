import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

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
  console.log('=== TELEGRAM AUTH START ===');
  console.log('Raw data received:', JSON.stringify(telegramData, null, 2));
  
  try {
    // === PHASE 1: ENVIRONMENT VARIABLE CHECK ===
    console.log('🔍 Starting environment check...');
    
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    console.log('📊 Environment Variables Status:');
    console.log(`- SUPABASE_URL: { exists: ${!!supabaseUrl}, value: "${supabaseUrl}" }`);
    console.log(`- SUPABASE_ANON_KEY: { exists: ${!!supabaseAnonKey}, length: ${supabaseAnonKey?.length || 0} }`);
    console.log(`- SERVICE_ROLE_KEY: {
  exists: ${!!serviceRoleKey},
  length: ${serviceRoleKey?.length || 0},
  starts_with: "${serviceRoleKey?.substring(0, 10) || 'N/A'}",
  is_jwt_format: ${serviceRoleKey?.startsWith('eyJhbGciOi') || false}
}`);
    console.log(`- TELEGRAM_BOT_TOKEN: { exists: ${!!botToken}, length: ${botToken?.length || 0}, starts_with: "${botToken?.substring(0, 10) || 'N/A'}" }`);

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !botToken) {
      const missingVars = [];
      if (!supabaseUrl) missingVars.push('SUPABASE_URL');
      if (!supabaseAnonKey) missingVars.push('SUPABASE_ANON_KEY');
      if (!serviceRoleKey) missingVars.push('SERVICE_ROLE_KEY');
      if (!botToken) missingVars.push('TELEGRAM_BOT_TOKEN');

      console.error('❌ Missing environment variables:', missingVars);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing environment variables',
          missing_variables: missingVars
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ All required environment variables are present');

    // === PHASE 2: SUPABASE CONNECTION TEST ===
    console.log('🔗 Testing Supabase connection...');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    try {
      const { error: connectionError } = await supabase.from('profiles').select('count').limit(1);
      if (connectionError) {
        console.error('❌ Supabase connection test failed:', connectionError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Supabase connection failed',
            details: connectionError.message
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      console.log('✅ Supabase connection successful');
    } catch (exception) {
      console.error('❌ Supabase connection exception:', exception);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Supabase connection exception',
          details: exception.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🎉 All environment checks passed successfully!');

    // === PHASE 3: TELEGRAM AUTHENTICATION ===
    console.log('🔐 Starting Telegram authentication process...');

    // Validate Telegram data structure
    if (!validateTelegramData(telegramData)) {
      console.error('❌ Invalid Telegram data structure');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid Telegram data structure',
          received_data: telegramData
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify Telegram signature
    console.log('🔍 Verifying Telegram signature...');
    const isValidSignature = await verifyTelegramAuth(telegramData, botToken);
    if (!isValidSignature) {
      console.error('❌ Invalid Telegram signature');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid Telegram signature'
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Telegram signature verified successfully');

    // === PHASE 4: USER MANAGEMENT ===
    // Generate user credentials
    const email = generateEmailFromTelegram(telegramData);
    const fullName = generateFullName(telegramData);
    const temporaryPassword = `telegram_${telegramData.id}_${Date.now()}`;

    console.log(`📧 Generated email: ${email}`);
    console.log(`👤 Generated full name: ${fullName}`);

    // Check if user already exists
    console.log('🔍 Checking if user already exists...');
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', telegramData.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error checking existing profile:', profileError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error while checking existing user',
          details: profileError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (existingProfile) {
      console.log('✅ User already exists, updating Telegram info...');
      
      // Update existing user's Telegram info
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          telegram_username: telegramData.username || null,
          telegram_first_name: telegramData.first_name || null,
          telegram_photo_url: telegramData.photo_url || null,
          last_login: new Date().toISOString()
        })
        .eq('telegram_id', telegramData.id);

      if (updateError) {
        console.error('❌ Error updating existing profile:', updateError);
      } else {
        console.log('✅ Profile updated successfully');
      }

      return new Response(
        JSON.stringify({
          success: true,
          email: existingProfile.email,
          password: temporaryPassword,
          user: {
            id: existingProfile.id,
            email: existingProfile.email,
            full_name: existingProfile.full_name,
            telegram_id: telegramData.id
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // === PHASE 5: CREATE NEW USER ===
    console.log('👤 Creating new user...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        telegram_id: telegramData.id,
        telegram_username: telegramData.username,
        telegram_first_name: telegramData.first_name,
        telegram_photo_url: telegramData.photo_url
      }
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create user account',
          details: authError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Auth user created successfully:', authUser.user?.id);

    // Create profile
    console.log('📝 Creating user profile...');
    const { error: profileCreateError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user!.id,
        email: email,
        full_name: fullName,
        telegram_id: telegramData.id,
        telegram_username: telegramData.username || null,
        telegram_first_name: telegramData.first_name || null,
        telegram_photo_url: telegramData.photo_url || null,
        auth_method: 'telegram',
        user_type: 'buyer',
        first_login_completed: false,
        last_login: new Date().toISOString()
      });

    if (profileCreateError) {
      console.error('❌ Error creating profile:', profileCreateError);
      // Try to clean up auth user if profile creation failed
      try {
        await supabase.auth.admin.deleteUser(authUser.user!.id);
        console.log('🧹 Cleaned up auth user after profile creation failure');
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup auth user:', cleanupError);
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create user profile',
          details: profileCreateError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Profile created successfully');

    return new Response(
      JSON.stringify({
        success: true,
        email: email,
        password: temporaryPassword,
        user: {
          id: authUser.user!.id,
          email: email,
          full_name: fullName,
          telegram_id: telegramData.id
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error during authentication:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unexpected error during authentication',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

console.log('🚀 Telegram Complete Auth Function starting up...');

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