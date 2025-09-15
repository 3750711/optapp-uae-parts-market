import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // First verify the reset code
    console.log('Verifying reset code for email:', email);
    const { data: verifyResult, error: verifyError } = await supabase.rpc('verify_reset_code', {
      p_email: email,
      p_code: code
    });

    if (verifyError) {
      console.error('Error verifying reset code:', verifyError);
      return new Response(
        JSON.stringify({ success: false, message: 'Ошибка при проверке кода' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!verifyResult || !verifyResult.success) {
      console.error('Code verification failed:', verifyResult);
      return new Response(
        JSON.stringify({ success: false, message: 'Неверный или истекший код' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Code verified successfully, proceeding to password reset');

    // Get user by email to find user ID
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return new Response(
        JSON.stringify({ success: false, message: 'Ошибка при поиске пользователя' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = userData.users.find(u => u.email === email);
    if (!user) {
      console.error('User not found for email:', email);
      return new Response(
        JSON.stringify({ success: false, message: 'Пользователь не найден' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user password using admin API
    console.log('Updating password for user ID:', user.id);
    const { error: passwordError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (passwordError) {
      console.error('Error updating password:', passwordError);
      return new Response(
        JSON.stringify({ success: false, message: 'Ошибка при изменении пароля' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Password updated successfully for user:', user.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Пароль успешно изменен' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in admin-password-reset:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Внутренняя ошибка сервера' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});