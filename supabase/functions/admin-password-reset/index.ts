import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from '../_shared/client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, newPassword } = await req.json();
    
    console.log('Password reset request received for email:', email);
    
    if (!email || !code || !newPassword) {
      console.error('Missing required parameters:', { email: !!email, code: !!code, newPassword: !!newPassword });
      return new Response(
        JSON.stringify({ success: false, message: 'Отсутствуют обязательные параметры' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabase = createServiceClient();

    // Get client IP and user agent for security logging
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // First verify the reset code
    console.log('Verifying reset code for email:', email);
    const { data: verifyResult, error: verifyError } = await supabase.rpc('verify_reset_code', {
      p_email: email,
      p_code: code
    });

    if (verifyError) {
      console.error('Error verifying reset code:', verifyError);
      
      // Log security event
      await supabase.rpc('log_security_event', {
        p_action: 'password_reset_verification_error',
        p_user_id: null,
        p_ip_address: clientIP,
        p_user_agent: userAgent,
        p_error_message: verifyError.message,
        p_details: {
          email: email
        }
      });

      return new Response(
        JSON.stringify({ success: false, message: 'Ошибка при проверке кода' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!verifyResult || !verifyResult.success) {
      console.error('Code verification failed:', verifyResult);
      
      // Log security event for invalid code
      await supabase.rpc('log_security_event', {
        p_action: 'password_reset_invalid_code',
        p_user_id: null,
        p_ip_address: clientIP,
        p_user_agent: userAgent,
        p_error_message: 'Invalid or expired reset code',
        p_details: {
          email: email
        }
      });

      return new Response(
        JSON.stringify({ success: false, message: 'Неверный или истекший код' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Code verified successfully, proceeding to password reset');

    // Get user ID by email from profiles table (more efficient and reliable)
    const { data: userProfile, error: userIdError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userIdError || !userProfile) {
      console.error('Error getting user profile:', userIdError);
      
      await supabase.rpc('log_security_event', {
        p_action: 'password_reset_user_lookup_error',
        p_user_id: null,
        p_ip_address: clientIP,
        p_user_agent: userAgent,
        p_error_message: userIdError?.message || 'User not found',
        p_details: {
          email: email
        }
      });

      return new Response(
        JSON.stringify({ success: false, message: 'Ошибка при поиске пользователя' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userProfile.id;
    console.log('Found user ID for email:', email);

    // Update user password using admin API with retry mechanism
    console.log('Updating password for user ID:', userId);
    
    async function updatePasswordWithRetry(userId: string, password: string, maxRetries = 3): Promise<{ success: boolean; error?: any }> {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Password update attempt ${attempt}/${maxRetries} for user:`, userId);
          
          const { error } = await supabase.auth.admin.updateUserById(userId, {
            password: password
          });
          
          if (!error) {
            console.log(`Password updated successfully on attempt ${attempt} for user:`, userId);
            return { success: true };
          }
          
          console.log(`Attempt ${attempt} failed:`, error);
          
          if (attempt === maxRetries) {
            return { success: false, error };
          }
          
          // Exponential backoff delay
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        } catch (err) {
          console.error(`Attempt ${attempt} exception:`, err);
          if (attempt === maxRetries) {
            return { success: false, error: err };
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
      return { success: false, error: new Error('Max retries exceeded') };
    }

    const updateResult = await updatePasswordWithRetry(userId, newPassword);
    
    if (!updateResult.success) {
      console.error('Error updating password after all retries:', updateResult.error);
      
      // Log security event
      await supabase.rpc('log_security_event', {
        p_action: 'password_reset_update_failed',
        p_user_id: userId,
        p_ip_address: clientIP,
        p_user_agent: userAgent,
        p_error_message: updateResult.error?.message || 'Password update failed after retries',
        p_details: {
          email: email
        }
      });

      return new Response(
        JSON.stringify({ success: false, message: 'Ошибка при изменении пароля' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Password updated successfully for user:', userId);

    // Log successful password reset
    await supabase.rpc('log_security_event', {
      p_action: 'password_reset_successful',
      p_user_id: userId,
      p_ip_address: clientIP,
      p_user_agent: userAgent,
      p_error_message: null,
      p_details: {
        email: email
      }
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Пароль успешно изменен' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in admin-password-reset:', error);
    
    // Log security event for unexpected errors
    try {
      const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';
      
      const supabase = createServiceClient();
      await supabase.rpc('log_security_event', {
        p_action: 'password_reset_system_error',
        p_user_id: null,
        p_ip_address: clientIP,
        p_user_agent: userAgent,
        p_error_message: error instanceof Error ? error.message : 'Unknown error'
      });
    } catch (logError) {
      console.error('Error logging security event:', logError);
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Внутренняя ошибка сервера' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});