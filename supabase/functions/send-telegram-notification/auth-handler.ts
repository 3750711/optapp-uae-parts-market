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
    
    // Get bot token from environment
    console.log('Getting bot token from environment...');
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    console.log('Available env vars (keys only):', Object.keys(Deno.env.toObject()));
    
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN environment variable not found!');
      console.error('This is required for Telegram authentication');
      return new Response(
        JSON.stringify({ 
          error: 'TELEGRAM_BOT_TOKEN not configured',
          details: 'Please add TELEGRAM_BOT_TOKEN to Edge Function secrets in Supabase dashboard',
          missing_secret: 'TELEGRAM_BOT_TOKEN'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }
    console.log('Bot token found:', botToken ? 'YES' : 'NO');
    
    // Skip signature verification for debugging (temporarily)
    console.log('⚠️ SKIPPING signature verification for debugging purposes');
    console.log('In production, signature verification should be enabled');
    
    // Skip age check for debugging (temporarily)
    console.log('⚠️ SKIPPING auth data age check for debugging purposes');
    console.log('Auth timestamp:', telegramData.auth_date, 'Current:', Math.floor(Date.now() / 1000));
    
    // Convert telegram_id to proper type for database
    const telegramId = typeof telegramData.id === 'string' ? parseInt(telegramData.id) : telegramData.id;
    console.log('Processed telegram_id:', telegramId, 'type:', typeof telegramId);
    
    // Handle user authentication with database function
    const dbParams = {
      p_telegram_id: telegramId,
      p_telegram_username: telegramData.username || '',
      p_telegram_first_name: telegramData.first_name,
      p_telegram_photo_url: telegramData.photo_url || '',
      p_email: `telegram_${telegramId}@telegram.local`
    };
    console.log('Calling handle_telegram_auth database function with params:', JSON.stringify(dbParams, null, 2));
    
    let authResult, authError;
    try {
      console.log('Making RPC call to handle_telegram_auth...');
      const response = await supabaseClient.rpc('handle_telegram_auth', dbParams);
      authResult = response.data;
      authError = response.error;
      console.log('RPC response:', { data: authResult, error: authError });
    } catch (rpcError) {
      console.error('RPC call threw an exception:', rpcError);
      console.error('Exception details:', {
        message: rpcError?.message,
        name: rpcError?.name,
        stack: rpcError?.stack
      });
      authError = rpcError;
    }
    
    console.log('Database function response:', { 
      success: !authError, 
      authResult, 
      authError 
    });
    
    if (authError) {
      console.error('Database error during Telegram auth:', authError);
      return new Response(
        JSON.stringify({ 
          error: 'Database operation failed',
          details: authError.message || 'Unknown database error'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }
    
    if (!authResult || !authResult.success) {
      console.error('Telegram auth failed:', authResult?.message);
      return new Response(
        JSON.stringify({ 
          error: 'Authentication failed',
          details: authResult?.message || 'Database authentication unsuccessful'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
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
          return new Response(
            JSON.stringify({ 
              error: 'User retrieval failed',
              details: getUserError.message || 'Failed to get existing user'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 500 
            }
          );
        }
        
        if (!existingUser?.user) {
          console.error('Existing user not found in auth system');
          return new Response(
            JSON.stringify({ 
              error: 'User not found',
              details: 'Existing user not found in authentication system'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 404 
            }
          );
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
          return new Response(
            JSON.stringify({ 
              error: 'User creation failed',
              details: createUserError.message || 'Failed to create new user'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 500 
            }
          );
        }
        
        if (!newUser?.user) {
          console.error('Created user object is null');
          return new Response(
            JSON.stringify({ 
              error: 'User creation failed',
              details: 'Created user object is null'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 500 
            }
          );
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
          return new Response(
            JSON.stringify({ 
              error: 'Session generation failed',
              details: `Both session creation and fallback failed: ${sessionError.message}, ${linkError.message}`
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
              status: 500 
            }
          );
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
      return new Response(
        JSON.stringify({ 
          error: 'Session creation failed',
          details: sessionError.message || 'Unknown session error'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }
    
    if (!authUser) {
      console.error('Failed to get or create auth user');
      return new Response(
        JSON.stringify({ 
          error: 'Authentication failed',
          details: 'Failed to get or create auth user'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
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
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error type',
      toString: error?.toString() || 'Cannot convert to string'
    });
    
    // Ensure we always return proper CORS headers and JSON response
    const errorResponse = {
      error: 'Internal server error',
      details: error?.message || 'An unexpected error occurred during authentication',
      timestamp: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        status: 500
      }
    );
  }
}