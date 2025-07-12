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
  telegramData: TelegramAuthData,
  supabaseClient: any,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    console.log('Handling Telegram authentication for user:', telegramData.id);
    
    // Get bot token from environment
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('Telegram bot token not configured');
    }
    
    // Verify auth data authenticity
    if (!verifyTelegramAuth(telegramData, botToken)) {
      console.error('Invalid Telegram auth data signature');
      return new Response(
        JSON.stringify({ error: 'Invalid authentication data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Check if auth data is not too old (5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - telegramData.auth_date > 300) {
      console.error('Telegram auth data is too old');
      return new Response(
        JSON.stringify({ error: 'Authentication data expired' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Handle user authentication with database function
    console.log('Calling handle_telegram_auth with params:', {
      p_telegram_id: telegramData.id,
      p_telegram_username: telegramData.username || null,
      p_telegram_first_name: telegramData.first_name,
      p_telegram_photo_url: telegramData.photo_url || null,
      p_email: null // Adding missing email parameter
    });
    
    const { data: authResult, error: authError } = await supabaseClient
      .rpc('handle_telegram_auth', {
        p_telegram_id: telegramData.id,
        p_telegram_username: telegramData.username || null,
        p_telegram_first_name: telegramData.first_name,
        p_telegram_photo_url: telegramData.photo_url || null,
        p_email: null // Adding missing email parameter with default value
      });
    
    if (authError) {
      console.error('Database error during Telegram auth:', authError);
      throw new Error(`Database error: ${authError.message}`);
    }
    
    if (!authResult.success) {
      console.error('Telegram auth failed:', authResult.message);
      return new Response(
        JSON.stringify({ error: authResult.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log('Telegram auth successful:', authResult);
    
    // Create or update Supabase Auth user
    let authUser = null;
    
    if (authResult.user_exists) {
      // Get existing auth user
      const { data: existingUser, error: getUserError } = await supabaseClient.auth.admin.getUserById(authResult.user_id);
      if (!getUserError && existingUser.user) {
        authUser = existingUser.user;
      }
    } else {
      // Create new auth user
      const tempEmail = `telegram_${telegramData.id}@temp.local`;
      const tempPassword = crypto.randomUUID();
      
      const { data: newUser, error: createUserError } = await supabaseClient.auth.admin.createUser({
        email: tempEmail,
        password: tempPassword,
        user_metadata: {
          telegram_id: telegramData.id,
          telegram_username: telegramData.username,
          telegram_first_name: telegramData.first_name,
          auth_method: 'telegram'
        },
        email_confirm: true
      });
      
      if (createUserError) {
        console.error('Error creating auth user:', createUserError);
        throw new Error(`Auth user creation failed: ${createUserError.message}`);
      }
      
      authUser = newUser.user;
    }
    
    if (!authUser) {
      throw new Error('Failed to get or create auth user');
    }
    
    // Generate access token for the user
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: authUser.email,
      options: {
        redirectTo: `${Deno.env.get('SUPABASE_URL')}/auth/v1/callback`
      }
    });
    
    if (sessionError) {
      console.error('Error generating session:', sessionError);
      throw new Error(`Session generation failed: ${sessionError.message}`);
    }
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        user_id: authResult.user_id,
        user_exists: authResult.user_exists,
        profile_completed: authResult.profile_completed,
        access_token: sessionData.properties?.access_token,
        refresh_token: sessionData.properties?.refresh_token,
        expires_at: sessionData.properties?.expires_at,
        user: {
          id: authUser.id,
          email: authUser.email,
          telegram_id: telegramData.id,
          telegram_username: telegramData.username,
          telegram_first_name: telegramData.first_name
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
    
  } catch (error) {
    console.error('Error in Telegram auth handler:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Authentication failed',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
}