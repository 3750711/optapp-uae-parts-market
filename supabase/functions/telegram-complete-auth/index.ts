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
  console.log('=== TELEGRAM AUTH DIAGNOSTIC START ===');
  console.log('Raw data received:', JSON.stringify(telegramData, null, 2));
  
  try {
    // === PHASE 1: COMPREHENSIVE ENVIRONMENT VARIABLE CHECK ===
    console.log('🔍 Starting comprehensive environment check...');
    
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    // Log detailed info about each variable
    console.log('📊 Environment Variables Status:');
    console.log('- TELEGRAM_BOT_TOKEN:', {
      exists: !!botToken,
      length: botToken?.length || 0,
      starts_with: botToken?.substring(0, 10) || 'N/A'
    });
    console.log('- SERVICE_ROLE_KEY:', {
      exists: !!serviceRoleKey,
      length: serviceRoleKey?.length || 0,
      starts_with: serviceRoleKey?.substring(0, 10) || 'N/A',
      is_jwt_format: serviceRoleKey?.startsWith('eyJ') || false
    });
    console.log('- SUPABASE_URL:', {
      exists: !!supabaseUrl,
      value: supabaseUrl || 'N/A'
    });
    console.log('- SUPABASE_ANON_KEY:', {
      exists: !!supabaseAnonKey,
      length: supabaseAnonKey?.length || 0
    });
    
    // Detailed missing variable analysis
    const missingVars = [];
    if (!botToken) missingVars.push('TELEGRAM_BOT_TOKEN');
    if (!serviceRoleKey) missingVars.push('SERVICE_ROLE_KEY'); 
    if (!supabaseUrl) missingVars.push('SUPABASE_URL');
    
    if (missingVars.length > 0) {
      console.error('❌ CRITICAL: Missing environment variables:', missingVars);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error - missing environment variables',
          diagnostics: {
            missing_variables: missingVars,
            all_env_vars: Object.keys(Deno.env.toObject()).sort(),
            telegram_bot_token: {
              exists: !!botToken,
              length: botToken?.length || 0
            },
            service_role_key: {
              exists: !!serviceRoleKey,
              length: serviceRoleKey?.length || 0,
              format_check: serviceRoleKey?.startsWith('eyJ') || false
            },
            supabase_url: {
              exists: !!supabaseUrl,
              value: supabaseUrl
            }
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ All required environment variables are present');
    
    // === PHASE 2: BASIC SUPABASE CONNECTION TEST ===
    console.log('🔗 Testing Supabase connection...');
    try {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      
      // Simple connection test
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('count')
        .limit(1);
        
      if (error) {
        console.error('❌ Supabase connection test failed:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Supabase connection failed',
            diagnostics: {
              connection_error: error.message,
              error_code: error.code,
              supabase_url: supabaseUrl,
              service_key_format: serviceRoleKey.startsWith('eyJ')
            }
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('✅ Supabase connection successful');
      
    } catch (connectionError) {
      console.error('❌ Supabase connection exception:', connectionError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Supabase connection exception',
          diagnostics: {
            exception_message: connectionError.message,
            exception_stack: connectionError.stack
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // === PHASE 3: RETURN SUCCESS WITH DIAGNOSTICS ===
    console.log('🎉 All environment checks passed successfully!');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Environment diagnostic completed successfully',
        diagnostics: {
          telegram_bot_token: {
            exists: true,
            length: botToken.length,
            format_preview: botToken.substring(0, 15) + '...'
          },
          service_role_key: {
            exists: true,
            length: serviceRoleKey.length,
            is_jwt_format: serviceRoleKey.startsWith('eyJ')
          },
          supabase_url: {
            exists: true,
            value: supabaseUrl
          },
          connection_test: 'passed',
          timestamp: new Date().toISOString()
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ CRITICAL ERROR in handleTelegramCompleteAuth:', error);
    console.error('Error stack:', error?.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error?.message || 'Unknown critical error',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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