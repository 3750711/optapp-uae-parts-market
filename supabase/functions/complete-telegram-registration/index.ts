import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuration
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

interface TelegramRegistrationData {
  telegram_data: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  };
  form_data: {
    full_name: string;
    user_type: 'buyer' | 'seller';
  };
}

// Utility functions for data processing
function sanitizeUsername(username: string): string {
  return username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

function sanitizeName(name: string): string {
  return name.replace(/[<>]/g, '').trim();
}

function generateEmailFromTelegram(telegramData: any): string {
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

async function handleTelegramRegistration(data: TelegramRegistrationData): Promise<Response> {
  try {
    console.log('=== STARTING TELEGRAM REGISTRATION ===');
    console.log('Function called at:', new Date().toISOString());
    console.log('Registration data:', {
      telegram_id: data.telegram_data.id,
      full_name: data.form_data.full_name,
      user_type: data.form_data.user_type
    });
    
    // Get required secrets from environment
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY environment variable not found!');
      return new Response(
        JSON.stringify({ 
          error: 'SUPABASE_SERVICE_ROLE_KEY not configured',
          details: 'Please add SUPABASE_SERVICE_ROLE_KEY to Edge Function secrets'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }
    
    // Create admin client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Validate input data
    if (!data.telegram_data?.id || !data.form_data?.full_name?.trim()) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid registration data',
          details: 'Telegram ID and full name are required'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }
    
    const telegramId = data.telegram_data.id;
    
    // Check if user already exists
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();
    
    if (existingProfile) {
      return new Response(
        JSON.stringify({ 
          error: 'User already exists',
          details: 'A user with this Telegram ID already exists'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 409 
        }
      );
    }
    
    // Generate email and create user
    const generatedEmail = generateEmailFromTelegram(data.telegram_data);
    const tempPassword = crypto.randomUUID() + Date.now().toString();
    
    console.log('Creating new user with email:', generatedEmail);
    
    // Create new auth user - the trigger handle_new_user() will create the profile automatically
    const { data: newUserData, error: createError } = await adminClient.auth.admin.createUser({
      email: generatedEmail,
      password: tempPassword,
      user_metadata: {
        telegram_id: telegramId,
        telegram_username: data.telegram_data.username,
        telegram_first_name: data.telegram_data.first_name,
        telegram_last_name: data.telegram_data.last_name,
        full_name: data.form_data.full_name.trim(),
        photo_url: data.telegram_data.photo_url,
        auth_method: 'telegram',
        user_type: data.form_data.user_type
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
    
    console.log('Created new auth user:', newUserData.user.id);
    
    // Give trigger time to execute and verify profile was created
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const { data: createdProfile, error: profileCheckError } = await adminClient
      .from('profiles')
      .select('id, profile_completed')
      .eq('id', newUserData.user.id)
      .single();
    
    if (profileCheckError || !createdProfile) {
      console.error('Profile was not created by trigger:', profileCheckError);
      // Clean up auth user
      await adminClient.auth.admin.deleteUser(newUserData.user.id);
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
    
    // Update profile with complete data and set profile_completed = true
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        full_name: data.form_data.full_name.trim(),
        user_type: data.form_data.user_type,
        profile_completed: true,
        avatar_url: data.telegram_data.photo_url || null
      })
      .eq('id', newUserData.user.id);
    
    if (updateError) {
      console.error('Error updating profile:', updateError);
      // Clean up auth user
      await adminClient.auth.admin.deleteUser(newUserData.user.id);
      return new Response(
        JSON.stringify({ 
          error: 'Profile update failed',
          details: updateError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }
    
    console.log('✅ Profile updated successfully with complete data');
    
    // Verify the update was successful
    const { data: finalProfile, error: verifyError } = await adminClient
      .from('profiles')
      .select('profile_completed, full_name, user_type')
      .eq('id', newUserData.user.id)
      .single();
    
    if (verifyError || !finalProfile?.profile_completed) {
      console.error('Profile verification failed:', verifyError);
      return new Response(
        JSON.stringify({ 
          error: 'Profile verification failed',
          details: 'Profile was not properly completed'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }
    
    console.log('✅ Profile verification successful:', {
      profile_completed: finalProfile.profile_completed,
      full_name: finalProfile.full_name,
      user_type: finalProfile.user_type
    });
    
    // Return success with login credentials
    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserData.user.id,
        email: generatedEmail,
        temp_password: tempPassword,
        profile_completed: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('=== TELEGRAM REGISTRATION ERROR ===');
    console.error('Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error type'
    });
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error?.message || 'An unexpected error occurred during registration',
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

console.log('🚀 Complete Telegram Registration Function starting up...');

serve(async (req) => {
  console.log('=== COMPLETE TELEGRAM REGISTRATION FUNCTION CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const reqData = await req.json();
    console.log('Received registration data');

    // Handle Telegram registration
    return await handleTelegramRegistration(reqData);
  } catch (error) {
    console.error('=== COMPLETE TELEGRAM REGISTRATION FUNCTION ERROR ===');
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