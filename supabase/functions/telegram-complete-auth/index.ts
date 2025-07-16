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
    // 1. Environment check with detailed logging
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    console.log('Environment check:');
    console.log('- TELEGRAM_BOT_TOKEN:', botToken ? '✓ SET' : '❌ MISSING');
    console.log('- SERVICE_ROLE_KEY:', serviceRoleKey ? '✓ SET' : '❌ MISSING');
    console.log('- SUPABASE_URL:', supabaseUrl ? '✓ SET' : '❌ MISSING');
    
    if (!botToken || !serviceRoleKey || !supabaseUrl) {
      console.error('❌ Missing critical environment variables');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error',
          missing: {
            botToken: !botToken,
            serviceKey: !serviceRoleKey,
            supabaseUrl: !supabaseUrl
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Data validation with detailed logging
    console.log('Validating Telegram data...');
    if (!validateTelegramData(telegramData)) {
      console.error('❌ Data validation failed');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid Telegram data format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('✅ Data validation passed');

    // 3. Signature verification with detailed logging
    console.log('Verifying Telegram signature...');
    const isSignatureValid = await verifyTelegramAuth(telegramData, botToken);
    if (!isSignatureValid) {
      console.error('❌ Signature verification failed');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('✅ Signature verification passed');

    // 4. Prepare user data with type safety
    const telegramId = Number(telegramData.id); // Ensure it's a number
    const email = generateEmailFromTelegram(telegramData);
    const fullName = generateFullName(telegramData);
    const temporaryPassword = `tg_${telegramId}_${Date.now()}`;
    
    console.log('User data prepared:', {
      telegramId,
      email,
      fullName,
      username: telegramData.username || 'N/A'
    });

    // 5. Initialize Supabase Admin with connection test
    console.log('Initializing Supabase admin client...');
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 6. Check for existing user by telegram_id
    console.log(`Checking for existing user with telegram_id: ${telegramId}`);
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Error checking existing profile:', profileError);
      // Continue anyway - might be first user
    }

    if (existingProfile) {
      console.log('📝 Existing user found:', existingProfile.id);
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingProfile.id,
        { password: temporaryPassword }
      );
      
      if (updateError) {
        console.error('❌ Password update failed:', updateError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to update existing user',
            details: updateError.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Existing user password updated');
      return new Response(
        JSON.stringify({
          success: true,
          email: existingProfile.email,
          password: temporaryPassword,
          isExisting: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Create new user with minimal metadata
    console.log('👤 Creating new user with email:', email);
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        auth_method: 'telegram',
        telegram_id: telegramId, // Keep as number
        full_name: fullName,
        telegram_username: telegramData.username || null,
        telegram_first_name: telegramData.first_name,
        telegram_photo_url: telegramData.photo_url || null,
        user_type: 'buyer'
      }
    });

    if (createError) {
      console.error('❌ User creation failed:', createError);
      
      // Check if user already exists error
      if (createError.message?.includes('already been registered')) {
        console.log('📝 User exists by email, trying to find and update...');
        
        // Try to find user by email and update telegram data
        const { data: userByEmail } = await supabaseAdmin
          .from('profiles')
          .select('id, email')
          .eq('email', email)
          .maybeSingle();
        
        if (userByEmail) {
          console.log('Found user by email, updating...');
          
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userByEmail.id,
            { password: temporaryPassword }
          );
          
          if (!updateError) {
            // Update profile with telegram data
            await supabaseAdmin
              .from('profiles')
              .update({
                telegram_id: telegramId,
                telegram_username: telegramData.username,
                telegram_first_name: telegramData.first_name,
                telegram_photo_url: telegramData.photo_url,
                auth_method: 'telegram'
              })
              .eq('id', userByEmail.id);
            
            console.log('✅ Existing user updated with Telegram data');
            return new Response(
              JSON.stringify({
                success: true,
                email: userByEmail.email,
                password: temporaryPassword,
                isUpdated: true
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User creation failed',
          details: createError.message,
          code: createError.status
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ New user created successfully:', newUser.user?.id);

    // 8. Small delay to let trigger finish
    await new Promise(resolve => setTimeout(resolve, 500));

    return new Response(
      JSON.stringify({
        success: true,
        email,
        password: temporaryPassword,
        userId: newUser.user?.id,
        isNew: true
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