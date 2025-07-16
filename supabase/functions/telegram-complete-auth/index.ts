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
function generateEmailFromTelegram(telegramData: TelegramAuthData): string {
  const telegramId = telegramData.id;
  
  if (telegramData.username && telegramData.username.trim().length > 0) {
    const cleanUsername = telegramData.username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    if (cleanUsername.length >= 3) {
      return `${cleanUsername}.${telegramId}@telegram.partsbay.ae`;
    }
  }
  
  if (telegramData.first_name && telegramData.first_name.trim().length > 0) {
    const cleanFirstName = telegramData.first_name.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    if (cleanFirstName.length >= 2) {
      return `${cleanFirstName}.${telegramId}@telegram.partsbay.ae`;
    }
  }
  
  return `user.${telegramId}@telegram.partsbay.ae`;
}

function generateFullName(telegramData: TelegramAuthData): string {
  const firstName = telegramData.first_name ? telegramData.first_name.trim() : '';
  const lastName = telegramData.last_name ? telegramData.last_name.trim() : '';
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  }
  
  return 'Telegram User';
}

// Verify Telegram signature
async function verifyTelegramAuth(authData: TelegramAuthData, botToken: string): Promise<boolean> {
  try {
    const { hash, ...data } = authData;
    
    // Check auth_date (must be within 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const authTime = data.auth_date;
    const timeDiff = currentTime - authTime;
    
    if (timeDiff > 300) { // 5 minutes
      return false;
    }
    
    // Create check string from data
    const checkString = Object.keys(data)
      .sort()
      .map(key => `${key}=${data[key as keyof typeof data]}`)
      .join('\n');
    
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
    
    return calculatedHash === hash;
  } catch (error) {
    console.error('Error in Telegram signature verification:', error);
    return false;
  }
}

async function handleTelegramCompleteAuth(telegramData: any): Promise<Response> {
  console.log('🚀 Starting simplified Telegram auth...');
  
  try {
    // Basic validation
    if (!telegramData || typeof telegramData !== 'object') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid data'
      }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Check required environment variables
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!botToken || !serviceRoleKey || !supabaseUrl) {
      console.error('Missing environment variables');
      return new Response(JSON.stringify({
        success: false,
        error: 'Server configuration error'
      }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Verify Telegram signature
    console.log('🔐 Verifying Telegram signature...');
    const isValidSignature = await verifyTelegramAuth(telegramData, botToken);
    if (!isValidSignature) {
      console.error('❌ Invalid Telegram signature');
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid signature'
      }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    console.log('✅ Signature verified');

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Generate user credentials
    const email = generateEmailFromTelegram(telegramData);
    const fullName = generateFullName(telegramData);
    const temporaryPassword = `tg_${telegramData.id}_${Date.now()}`;

    console.log(`📧 Email: ${email}`);

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('telegram_id', telegramData.id)
      .maybeSingle();

    if (existingProfile) {
      console.log('✅ User exists, updating password...');
      
      // Update password for existing user
      const { error: passwordError } = await supabase.auth.admin.updateUserById(
        existingProfile.id,
        { password: temporaryPassword }
      );

      if (passwordError) {
        console.error('❌ Password update failed:', passwordError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to update credentials'
        }), { 
          status: 500, 
          headers: corsHeaders 
        });
      }

      return new Response(JSON.stringify({
        success: true,
        email: existingProfile.email,
        password: temporaryPassword,
        user: {
          id: existingProfile.id,
          email: existingProfile.email,
          full_name: existingProfile.full_name
        }
      }), { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Create new user
    console.log('👤 Creating new user...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        telegram_id: telegramData.id,
        auth_method: 'telegram'
      }
    });

    if (authError) {
      console.error('❌ User creation failed:', authError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create user'
      }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log('✅ User created successfully');

    return new Response(JSON.stringify({
      success: true,
      email: email,
      password: temporaryPassword,
      user: {
        id: authUser.user!.id,
        email: email,
        full_name: fullName
      }
    }), { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const telegramData = await req.json();
    return await handleTelegramCompleteAuth(telegramData);
  } catch (error) {
    console.error('❌ Request parsing error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid request format'
    }), { 
      status: 400, 
      headers: corsHeaders 
    });
  }
});