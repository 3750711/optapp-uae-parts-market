import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuration
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Utility functions for data processing
function sanitizeUsername(username: string): string {
  return username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

function sanitizeName(name: string): string {
  return name.replace(/[<>]/g, '').trim();
}

function generateEmailFromTelegram(telegramData: TelegramAuthData): string {
  const telegramId = telegramData.id;
  
  // Try username first (if available and valid)
  if (telegramData.username && telegramData.username.trim().length > 0) {
    const cleanUsername = sanitizeUsername(telegramData.username);
    if (cleanUsername.length >= 3) {
      return `${cleanUsername}.${telegramId}@telegram.partsbay.ae`;
    }
  }
  
  // Fallback to first_name + telegram_id
  if (telegramData.first_name && telegramData.first_name.trim().length > 0) {
    const cleanFirstName = sanitizeUsername(telegramData.first_name);
    if (cleanFirstName.length >= 2) {
      return `${cleanFirstName}.${telegramId}@telegram.partsbay.ae`;
    }
  }
  
  // Ultimate fallback
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

// Verify Telegram Login Widget data with Deno-compatible crypto
async function verifyTelegramAuth(authData: TelegramAuthData, botToken: string): Promise<boolean> {
  try {
    console.log('Starting signature verification...');
    
    if (!botToken) {
      console.error('Bot token is missing for signature verification');
      return false;
    }

    const { hash, ...data } = authData;
    
    // Check auth_date (must be within 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const authTime = data.auth_date;
    const timeDiff = currentTime - authTime;
    
    if (timeDiff > 300) { // 5 minutes
      console.error('Auth data too old. Current time:', currentTime, 'Auth time:', authTime, 'Diff:', timeDiff);
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
    console.error('Error in Telegram signature verification:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    return false; // SECURITY: Never allow authentication on verification errors
  }
}

async function handleTelegramAuth(telegramData: any): Promise<Response> {
  try {
    console.log('=== STARTING TELEGRAM VERIFICATION ===');
    console.log('Function called at:', new Date().toISOString());
    
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
    
    // Get bot token for signature verification
    const botToken = BOT_TOKEN;
    
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
    
    // Verify Telegram signature for security  
    console.log('Verifying Telegram auth with bot token...');
    const isValidSignature = await verifyTelegramAuth(telegramData, botToken);
    console.log('Signature verification result:', isValidSignature);
    
    if (!isValidSignature) {
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
    
    // Create clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const publicClient = createClient(supabaseUrl, supabaseKey);
    
    const email = generateEmailFromTelegram(telegramData);
    console.log(`📧 Generated email for search: ${email}`);
    console.log(`🔍 Step 1: Checking for existing user by telegram_id: ${telegramId} (type: ${typeof telegramId})`);
    
    // Step 1: Check if user exists by telegram_id in profiles table
    const { data: existingTelegramProfile, error: profileError } = await publicClient
      .from('profiles')
      .select('id, email, profile_completed, full_name, avatar_url, user_type, telegram_id, telegram')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    console.log('📊 Profile search by telegram_id result:', {
      found: !!existingTelegramProfile,
      profileError: profileError?.message,
      telegram_id_in_db: existingTelegramProfile?.telegram_id,
      email_in_db: existingTelegramProfile?.email
    });

    // Step 2: If not found by telegram_id, search by telegram username for account merging
    let existingUsernameProfile = null;
    if (!existingTelegramProfile && !profileError && telegramData.username) {
      const telegramUsername = telegramData.username.startsWith('@') ? telegramData.username : `@${telegramData.username}`;
      console.log(`🔍 Step 2: Searching by telegram username: ${telegramUsername}`);
      
      const { data: usernameProfile, error: usernameError } = await publicClient
        .from('profiles')
        .select('id, email, profile_completed, full_name, avatar_url, user_type, telegram_id, telegram')
        .eq('telegram', telegramUsername)
        .is('telegram_id', null) // Only email-based accounts without telegram_id
        .maybeSingle();
      
      console.log('📊 Profile search by telegram username result:', {
        found: !!usernameProfile,
        usernameError: usernameError?.message,
        telegram_username: usernameProfile?.telegram,
        email_in_db: usernameProfile?.email,
        has_telegram_id: !!usernameProfile?.telegram_id
      });
      
      existingUsernameProfile = usernameProfile;
    }

    // Step 3: If not found by username either, try searching by generated email as fallback
    let finalProfile = existingTelegramProfile || existingUsernameProfile;
    if (!finalProfile && !profileError) {
      console.log(`🔄 Step 3: Fallback search by generated email: ${email}`);
      const { data: profileByEmail, error: emailError } = await publicClient
        .from('profiles')
        .select('id, email, profile_completed, full_name, avatar_url, user_type, telegram_id')
        .eq('email', email)
        .maybeSingle();
      
      console.log('📊 Profile search by email result:', {
        found: !!profileByEmail,
        emailError: emailError?.message,
        telegram_id_in_db: profileByEmail?.telegram_id,
        email_in_db: profileByEmail?.email
      });
      
      finalProfile = profileByEmail;
    }

    // Step 3: If still not found, check auth.users table
    let authUser = null;
    if (!finalProfile) {
      console.log(`🔄 Fallback: Checking auth.users for email: ${email}`);
      
      if (serviceRoleKey) {
        const adminClient = createClient(supabaseUrl, serviceRoleKey);
        const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();
        
        if (!authError && authUsers?.users) {
          authUser = authUsers.users.find(user => user.email === email);
          console.log('📊 Auth.users search result:', {
            found: !!authUser,
            authError: authError?.message,
            user_email: authUser?.email,
            user_id: authUser?.id
          });
        }
      }
    }

    // Step 4: Handle different scenarios based on search results
    if (existingTelegramProfile) {
      // Scenario A: User already has telegram_id linked - direct login
      console.log('✅ Scenario A: Existing Telegram user found - direct login');
      const userData = {
        id: telegramId,
        first_name: telegramData.first_name,
        last_name: telegramData.last_name,
        username: telegramData.username,
        photo_url: telegramData.photo_url,
        email: existingTelegramProfile.email,
        full_name: existingTelegramProfile.full_name || generateFullName(telegramData),
        auth_method: 'telegram',
        user_type: existingTelegramProfile.user_type || 'buyer'
      };

      return new Response(
        JSON.stringify({
          success: true,
          is_existing_user: true,
          profile_completed: Boolean(existingTelegramProfile.profile_completed),
          telegram_data: userData
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        }
      );
    } else if (existingUsernameProfile) {
      // Scenario B: Account merge required - existing email account with same telegram username
      console.log('🔗 Scenario B: Account merge required - found email account with matching Telegram username');
      
      return new Response(
        JSON.stringify({
          success: true,
          requires_merge: true,
          existing_email: existingUsernameProfile.email,
          telegram_data: {
            id: telegramId,
            first_name: telegramData.first_name,
            last_name: telegramData.last_name,
            username: telegramData.username,
            photo_url: telegramData.photo_url
          },
          merge_reason: 'telegram_username_match',
          message: 'An account with this Telegram username already exists. Please enter your password to link accounts.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        }
      );
    } else if (finalProfile || authUser) {
      // Scenario C: Found by email fallback - existing user login
      console.log('✅ Scenario C: Existing user found by email fallback');
      const userEmail = finalProfile?.email || authUser?.email || email;
      const userData = {
        id: telegramId,
        first_name: telegramData.first_name,
        last_name: telegramData.last_name,
        username: telegramData.username,
        photo_url: telegramData.photo_url,
        email: userEmail,
        full_name: finalProfile?.full_name || generateFullName(telegramData),
        auth_method: 'telegram',
        user_type: finalProfile?.user_type || 'buyer'
      };

      return new Response(
        JSON.stringify({
          success: true,
          is_existing_user: true,
          profile_completed: Boolean(finalProfile?.profile_completed),
          telegram_data: userData
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        }
      );
    }
    
    // Scenario D: Completely new user - return data for signUp flow
    console.log('🎯 Scenario D: New user detected - returning data for signUp flow');
    
    return new Response(
      JSON.stringify({
        success: true,
        is_existing_user: false, // New user - use signUp flow
        telegram_data: {
          id: telegramId,
          first_name: telegramData.first_name,
          last_name: telegramData.last_name,
          username: telegramData.username,
          photo_url: telegramData.photo_url,
          auth_date: telegramData.auth_date,
          hash: telegramData.hash,
          email: email,
          full_name: generateFullName(telegramData),
          auth_method: 'telegram',
          user_type: 'buyer'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('=== TELEGRAM VERIFICATION ERROR ===');
    console.error('Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error type'
    });
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error?.message || 'An unexpected error occurred during verification',
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

console.log('🚀 Telegram Auth Function starting up...');
console.log('Environment variables check:');
console.log('- SUPABASE_URL exists:', !!Deno.env.get('SUPABASE_URL'));
console.log('- SUPABASE_ANON_KEY exists:', !!Deno.env.get('SUPABASE_ANON_KEY'));
console.log('- TELEGRAM_BOT_TOKEN exists:', !!BOT_TOKEN);

serve(async (req) => {
  console.log('=== TELEGRAM AUTH FUNCTION CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const reqData = await req.json();
    console.log('Received request data:', reqData);

    // Handle Telegram authentication
    return await handleTelegramAuth(reqData);
  } catch (error) {
    console.error('=== TELEGRAM AUTH FUNCTION ERROR ===');
    console.error('Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error type'
    });

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