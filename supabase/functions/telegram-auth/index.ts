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
    
    // Create both public and service role clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const publicClient = createClient(supabaseUrl, supabaseKey);
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Generate email for this user
    const generatedEmail = generateEmailFromTelegram(telegramData);
    console.log('Checking for existing user by email:', generatedEmail);
    console.log('Telegram ID for reference:', telegramId, 'type:', typeof telegramId);
    
    // First check auth.users to see if user exists there
    const { data: authUsers, error: authError } = await serviceClient.auth.admin.listUsers();
    const existingAuthUser = authUsers?.users?.find(user => user.email === generatedEmail);
    console.log('Auth.users search result:', existingAuthUser ? 'Found' : 'Not found');
    
    // Check profiles table
    const { data: existingProfile, error: profileError } = await publicClient
      .from('profiles')
      .select('id, email, profile_completed, full_name, avatar_url, telegram_id')
      .eq('email', generatedEmail)
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
    
    console.log('Profile search result:', existingProfile);
    
    // Check for telegram_id uniqueness to prevent duplicates
    const { data: existingTelegramProfile, error: telegramError } = await publicClient
      .from('profiles')
      .select('id, email, telegram_id')
      .eq('telegram_id', telegramId)
      .neq('email', generatedEmail) // Different email but same telegram_id
      .maybeSingle();
      
    if (existingTelegramProfile) {
      console.log('Found duplicate telegram_id with different email:', existingTelegramProfile);
      return new Response(
        JSON.stringify({ 
          error: 'Telegram ID already associated with another account',
          details: `This Telegram account is already linked to another user`
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }
    
    // Handle existing auth user without profile
    if (existingAuthUser && !existingProfile) {
      console.log('🔧 User exists in auth.users but not in profiles, recreating profile...');
      
      const fullName = generateFullName(telegramData);
      
      // Recreate profile for existing auth user
      const { data: newProfile, error: createError } = await publicClient
        .from('profiles')
        .insert({
          id: existingAuthUser.id,
          email: generatedEmail,
          full_name: fullName,
          avatar_url: telegramData.photo_url,
          telegram_id: telegramId,
          telegram: telegramData.username,
          auth_method: 'telegram',
          user_type: 'buyer',
          profile_completed: true
        })
        .select()
        .single();
        
      if (createError) {
        console.error('Error recreating profile:', createError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to recreate user profile',
            details: createError.message
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500 
          }
        );
      }
      
      console.log('✅ Profile recreated successfully:', newProfile);
      
      // Return existing user data
      return new Response(
        JSON.stringify({
          success: true,
          is_existing_user: true,
          profile_completed: true,
          existing_user_data: {
            email: generatedEmail,
            full_name: fullName,
            avatar_url: telegramData.photo_url
          },
          telegram_data: {
            id: telegramId,
            first_name: telegramData.first_name,
            last_name: telegramData.last_name,
            username: telegramData.username,
            photo_url: telegramData.photo_url
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        }
      );
    }
    
    if (existingProfile) {
      console.log('🔍 Found existing user:', {
        id: existingProfile.id,
        email: existingProfile.email,
        profile_completed: existingProfile.profile_completed
      });
      
      // Return existing user data for sign in
      return new Response(
        JSON.stringify({
          success: true,
          is_existing_user: true,
          profile_completed: Boolean(existingProfile.profile_completed),
          existing_user_data: {
            email: existingProfile.email,
            full_name: existingProfile.full_name,
            avatar_url: existingProfile.avatar_url
          },
          telegram_data: {
            id: telegramId,
            first_name: telegramData.first_name,
            last_name: telegramData.last_name,
            username: telegramData.username,
            photo_url: telegramData.photo_url
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        }
      );
      
    } else {
      console.log('🆕 New user - returning Telegram data for frontend registration');
      
      // For new users, return Telegram data so frontend can handle registration
      return new Response(
        JSON.stringify({
          success: true,
          is_existing_user: false,
          profile_completed: false,
          telegram_data: {
            id: telegramId,
            first_name: telegramData.first_name,
            last_name: telegramData.last_name,
            username: telegramData.username,
            photo_url: telegramData.photo_url,
            auth_date: telegramData.auth_date,
            hash: telegramData.hash
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        }
      );
    }
    
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

const FUNCTION_VERSION = '1.3.0-auth-sync-fix';
console.log('🚀 Telegram Auth Function starting up...');
console.log('Function version:', FUNCTION_VERSION);
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