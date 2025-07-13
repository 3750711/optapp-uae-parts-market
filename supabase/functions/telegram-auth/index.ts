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
    console.log('=== STARTING TELEGRAM AUTHENTICATION ===');
    console.log('Function called at:', new Date().toISOString());
    console.log('Has telegramData:', !!telegramData);
    console.log('TelegramData type:', typeof telegramData);
    console.log('Raw incoming data:', telegramData);
    console.log('Environment check - BOT_TOKEN available:', !!BOT_TOKEN);
    console.log('Environment check - SUPABASE_SERVICE_ROLE_KEY available:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    
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
    
    // Get required secrets from environment
    const botToken = BOT_TOKEN;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Bot token availability:', botToken ? 'Available' : 'Missing');
    
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
    
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY environment variable not found!');
      return new Response(
        JSON.stringify({ 
          error: 'SUPABASE_SERVICE_ROLE_KEY not configured',
          details: 'Please add SUPABASE_SERVICE_ROLE_KEY to Edge Function secrets',
          missing_secret: 'SUPABASE_SERVICE_ROLE_KEY'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }
    
    console.log('Both required secrets found');
    
    // Create admin client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
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
    
    // Check if user already exists by telegram_id
    console.log('Checking for existing user with telegram_id:', telegramId);
    const { data: existingProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, email, profile_completed, full_name, avatar_url')
      .eq('telegram_id', telegramId)
      .single();
    
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
    
    let authUser;
    let isNewUser = false;
    
    if (existingProfile) {
      console.log('🔍 Found existing profile:', {
        id: existingProfile.id,
        email: existingProfile.email,
        profile_completed: existingProfile.profile_completed,
        full_name: existingProfile.full_name
      });
      
      // Get additional profile data to check completion
      const { data: fullProfileData, error: fullProfileError } = await adminClient
        .from('profiles')
        .select('id, email, profile_completed, full_name, phone, location, avatar_url')
        .eq('telegram_id', telegramId)
        .single();
      
      if (fullProfileError) {
        console.error('Error getting full profile data:', fullProfileError);
        return new Response(
          JSON.stringify({ 
            error: 'Profile data error',
            details: fullProfileError.message
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500 
          }
        );
      }
      
      // Check if profile is really completed by validating ALL required fields
      const hasRequiredFields = !!(
        fullProfileData.full_name && 
        fullProfileData.full_name.trim().length > 0 &&
        fullProfileData.phone && 
        fullProfileData.phone.trim().length > 0 &&
        fullProfileData.location && 
        fullProfileData.location.trim().length > 0
      );
      
      const isProfileReallyCompleted = fullProfileData.profile_completed && hasRequiredFields;
      
      console.log('📊 DETAILED Profile completion analysis:', {
        profile_completed_flag: fullProfileData.profile_completed,
        has_full_name: !!fullProfileData.full_name,
        full_name_value: fullProfileData.full_name,
        has_phone: !!fullProfileData.phone,
        phone_value: fullProfileData.phone,
        has_location: !!fullProfileData.location,
        location_value: fullProfileData.location,
        has_all_required_fields: hasRequiredFields,
        is_really_completed: isProfileReallyCompleted
      });
      
      // Update existingProfile with full data
      existingProfile.phone = fullProfileData.phone;
      existingProfile.location = fullProfileData.location;
      
      // Get auth user
      const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(existingProfile.id);
      
      if (userError || !userData.user) {
        console.error('Error getting auth user:', userError);
        return new Response(
          JSON.stringify({ 
            error: 'User retrieval failed',
            details: userError?.message || 'User not found in auth system'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500 
          }
        );
      }
      
      authUser = userData.user;
      
      // Update telegram data in profile with expanded information
      const fullName = generateFullName(telegramData);
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({
          telegram_username: telegramData.username,
          telegram_first_name: telegramData.first_name,
          telegram_photo_url: telegramData.photo_url,
          // Update full name if it's not already set or if Telegram has more complete data
          full_name: fullProfileData.full_name || fullName,
          // Update avatar if not set or if Telegram photo is available
          avatar_url: fullProfileData.avatar_url || telegramData.photo_url
        })
        .eq('id', existingProfile.id);
      
      if (updateError) {
        console.error('❌ Error updating existing profile:', updateError);
      } else {
        console.log('✅ Updated existing profile with Telegram data');
      }
      
      // Override profile_completed with actual validation result
      existingProfile.profile_completed = isProfileReallyCompleted;
      
      console.log('🎯 FINAL decision for existing user:', {
        user_id: existingProfile.id,
        profile_completed_in_db: fullProfileData.profile_completed,
        has_all_required_fields: hasRequiredFields,
        final_profile_completed: isProfileReallyCompleted,
        action: isProfileReallyCompleted ? 'DIRECT_LOGIN' : 'SHOW_REGISTRATION_FORM'
      });
      
    } else {
      console.log('Creating new user for telegram_id:', telegramId);
      isNewUser = true;
      
      // Generate improved email and prepare user data
      const generatedEmail = generateEmailFromTelegram(telegramData);
      const fullName = generateFullName(telegramData);
      const tempPassword = crypto.randomUUID();
      
      console.log('Generated email for new user:', generatedEmail);
      console.log('Generated full name:', fullName);
      
      // Create new auth user - the trigger handle_new_user() will create the profile automatically
      const { data: newUserData, error: createError } = await adminClient.auth.admin.createUser({
        email: generatedEmail,
        password: tempPassword,
        user_metadata: {
          telegram_id: telegramId.toString(), // Store as string in metadata
          telegram_username: telegramData.username,
          telegram_first_name: telegramData.first_name,
          telegram_last_name: telegramData.last_name,
          full_name: fullName,
          photo_url: telegramData.photo_url,
          auth_method: 'telegram'
        },
        email_confirm: true
      });
      
      if (createError || !newUserData.user) {
        console.error('Error creating auth user:', createError);
        return new Response(
          JSON.stringify({ 
            error: 'User creation failed',
            details: createError?.message || 'Failed to create user'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500 
          }
        );
      }
      
      authUser = newUserData.user;
      console.log('Created new auth user:', authUser.id);
      console.log('Profile should be created automatically by trigger');
      
      // Give trigger time to execute and verify profile was created
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data: createdProfile, error: profileCheckError } = await adminClient
        .from('profiles')
        .select('id, profile_completed')
        .eq('id', authUser.id)
        .single();
      
      if (profileCheckError || !createdProfile) {
        console.error('Profile was not created by trigger:', profileCheckError);
        // Clean up auth user
        await adminClient.auth.admin.deleteUser(authUser.id);
        return new Response(
          JSON.stringify({ 
            error: 'Profile creation failed',
            details: 'Profile was not created automatically'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500 
          }
        );
      }
      
      console.log('✅ Profile created successfully by trigger:', createdProfile.id);
    }
    
    // Always generate fresh temporary password for automatic login
    console.log('Generating fresh temporary password for user:', authUser.id);
    const tempPassword = crypto.randomUUID() + Date.now().toString();
    
    // Always update user password temporarily for auto-login (regardless of profile completion status)
    const { error: passwordError } = await adminClient.auth.admin.updateUserById(
      authUser.id,
      { password: tempPassword }
    );
    
    if (passwordError) {
      console.error('Error setting temporary password:', passwordError);
      return new Response(
        JSON.stringify({ 
          error: 'Password setup failed',
          details: passwordError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }
    
    console.log('Fresh temporary password set successfully for user:', authUser.id);
    
    // Get the most current profile completion status from database
    const { data: currentProfile, error: currentProfileError } = await adminClient
      .from('profiles')
      .select('profile_completed, phone, location')
      .eq('id', authUser.id)
      .single();

    let finalProfileCompleted = false;
    
    if (currentProfileError) {
      console.log('❌ Error fetching current profile:', currentProfileError);
      finalProfileCompleted = false; // Default to false if we can't fetch
    } else if (currentProfile) {
      // Use ONLY the database flag, no complex logic
      finalProfileCompleted = Boolean(currentProfile.profile_completed);
      console.log('🔍 PROFILE STATUS CHECK:', {
        profile_completed_flag: currentProfile.profile_completed,
        phone: currentProfile.phone,
        location: currentProfile.location,
        final_decision: finalProfileCompleted
      });
    } else {
      finalProfileCompleted = false;
    }
    
    console.log('🚀 USER FLOW DECISION:', finalProfileCompleted ? 'SKIP_REGISTRATION' : 'SHOW_REGISTRATION');

    const response = {
      success: true,
      user_id: authUser.id,
      user_exists: !isNewUser,
      profile_completed: finalProfileCompleted,
      email: authUser.email,
      temp_password: tempPassword,
      user: {
        id: authUser.id,
        email: authUser.email,
        telegram_id: telegramId,
        telegram_username: telegramData.username,
        telegram_first_name: telegramData.first_name
      }
    };
    
    console.log('📤 Final response being sent:', {
      user_id: response.user_id,
      user_exists: response.user_exists,
      profile_completed: response.profile_completed,
      email: response.email
    });
    
    console.log('=== TELEGRAM AUTHENTICATION SUCCESSFUL ===');
    console.log('Response created for user:', authUser.id, 'isNewUser:', isNewUser);
    
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
      name: error?.name || 'Unknown error type'
    });
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error?.message || 'An unexpected error occurred during authentication',
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
console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
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