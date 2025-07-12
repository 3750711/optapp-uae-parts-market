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
    console.log('=== STARTING TELEGRAM AUTHENTICATION ===');
    console.log('Incoming Telegram data:', {
      id: telegramData.id,
      first_name: telegramData.first_name,
      username: telegramData.username,
      photo_url: telegramData.photo_url,
      auth_date: telegramData.auth_date,
      hash_provided: telegramData.hash ? 'yes' : 'no'
    });
    
    // Get bot token from environment
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN environment variable not set');
      throw new Error('Telegram bot token not configured');
    }
    console.log('Bot token found:', botToken ? 'yes' : 'no');
    
    // Verify auth data authenticity
    console.log('Verifying Telegram signature...');
    const isValidSignature = verifyTelegramAuth(telegramData, botToken);
    console.log('Signature verification result:', isValidSignature);
    
    if (!isValidSignature) {
      console.error('Invalid Telegram auth data signature');
      return new Response(
        JSON.stringify({ error: 'Invalid authentication data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Check if auth data is not too old (5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const authAge = currentTime - telegramData.auth_date;
    console.log('Auth data age check:', { 
      current_time: currentTime, 
      auth_date: telegramData.auth_date,
      age_seconds: authAge,
      max_allowed: 300,
      is_valid: authAge <= 300
    });
    
    if (authAge > 300) {
      console.error('Telegram auth data is too old');
      return new Response(
        JSON.stringify({ error: 'Authentication data expired' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Handle user authentication with database function
    const dbParams = {
      p_telegram_id: telegramData.id,
      p_telegram_username: telegramData.username || null,
      p_telegram_first_name: telegramData.first_name,
      p_telegram_photo_url: telegramData.photo_url || null,
      p_email: null
    };
    console.log('Calling handle_telegram_auth database function with params:', dbParams);
    
    const { data: authResult, error: authError } = await supabaseClient
      .rpc('handle_telegram_auth', dbParams);
    
    console.log('Database function response:', { 
      success: !authError, 
      authResult, 
      authError 
    });
    
    if (authError) {
      console.error('Database error during Telegram auth:', authError);
      throw new Error(`Database error: ${authError.message}`);
    }
    
    if (!authResult || !authResult.success) {
      console.error('Telegram auth failed:', authResult?.message);
      return new Response(
        JSON.stringify({ error: authResult?.message || 'Authentication failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log('Database authentication successful:', authResult);
    
    // Simplified session creation using direct token generation
    let authUser = null;
    let accessToken = null;
    let refreshToken = null;
    
    try {
      if (authResult.user_exists) {
        console.log('Getting existing auth user...');
        const { data: existingUser, error: getUserError } = await supabaseClient.auth.admin.getUserById(authResult.user_id);
        
        if (getUserError) {
          console.error('Error getting existing user:', getUserError);
          throw new Error(`Failed to get existing user: ${getUserError.message}`);
        }
        
        if (!existingUser?.user) {
          throw new Error('Existing user not found in auth system');
        }
        
        authUser = existingUser.user;
        console.log('Found existing user:', authUser.id);
        
      } else {
        console.log('Creating new auth user...');
        const tempEmail = `telegram_${telegramData.id}@temp.local`;
        const tempPassword = crypto.randomUUID();
        
        const createUserParams = {
          email: tempEmail,
          password: tempPassword,
          user_metadata: {
            telegram_id: telegramData.id,
            telegram_username: telegramData.username,
            telegram_first_name: telegramData.first_name,
            auth_method: 'telegram'
          },
          email_confirm: true
        };
        console.log('Creating user with params:', createUserParams);
        
        const { data: newUser, error: createUserError } = await supabaseClient.auth.admin.createUser(createUserParams);
        
        if (createUserError) {
          console.error('Error creating auth user:', createUserError);
          throw new Error(`Auth user creation failed: ${createUserError.message}`);
        }
        
        if (!newUser?.user) {
          throw new Error('Created user object is null');
        }
        
        authUser = newUser.user;
        console.log('Created new user:', authUser.id);
      }
      
      // Generate session for the user
      console.log('Generating session for user:', authUser.id);
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.admin.createSession({
        user_id: authUser.id
      });
      
      if (sessionError) {
        console.error('Error creating session:', sessionError);
        // Fallback to magic link method
        console.log('Trying fallback magic link method...');
        const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
          type: 'magiclink',
          email: authUser.email
        });
        
        if (linkError) {
          console.error('Fallback link generation failed:', linkError);
          throw new Error(`Session generation failed: ${sessionError.message}`);
        }
        
        accessToken = linkData.properties?.access_token;
        refreshToken = linkData.properties?.refresh_token;
      } else {
        accessToken = sessionData.access_token;
        refreshToken = sessionData.refresh_token;
      }
      
      console.log('Session tokens generated successfully');
      
    } catch (sessionError) {
      console.error('Session creation error:', sessionError);
      throw new Error(`Session creation failed: ${sessionError.message}`);
    }
    
    if (!authUser) {
      throw new Error('Failed to get or create auth user');
    }
    
    const response = {
      success: true,
      user_id: authResult.user_id,
      user_exists: authResult.user_exists,
      profile_completed: authResult.profile_completed,
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: authUser.id,
        email: authUser.email,
        telegram_id: telegramData.id,
        telegram_username: telegramData.username,
        telegram_first_name: telegramData.first_name
      }
    };
    
    console.log('=== TELEGRAM AUTHENTICATION SUCCESSFUL ===');
    console.log('Final response:', response);
    
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
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
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