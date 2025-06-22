
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AdminPasswordResetRequest {
  email: string;
  code: string;
  newPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, newPassword }: AdminPasswordResetRequest = await req.json();

    console.log("Admin password reset request:", { email, code: code ? "***" : "empty", passwordLength: newPassword?.length });

    if (!email || !code || !newPassword) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email, код и новый пароль обязательны" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Создаем Admin клиент Supabase
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Проверяем код через функцию базы данных  
    console.log("Verifying code with database function...");
    const { data: verifyResult, error: verifyError } = await supabaseAdmin.rpc(
      'verify_and_reset_password_v2',
      { 
        p_email: email,
        p_code: code,
        p_new_password: newPassword
      }
    );

    if (verifyError) {
      console.error('Database verification error:', verifyError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Ошибка при проверке кода",
          details: verifyError.message 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Database verification result:", verifyResult);

    if (!verifyResult.success) {
      return new Response(
        JSON.stringify(verifyResult),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Если верификация прошла успешно, меняем пароль через Admin API
    const userId = verifyResult.user_id;
    console.log("Updating password for user:", userId);

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Не удалось обновить пароль",
          details: updateError.message 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Логируем успешный сброс пароля
    try {
      await supabaseAdmin.rpc('log_password_reset_event', {
        p_user_id: userId,
        p_email: email,
        p_opt_id: verifyResult.opt_id || null
      });
    } catch (logError) {
      console.warn('Failed to log password reset event:', logError);
    }

    console.log("Password reset completed successfully for user:", userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Пароль успешно изменен"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in admin-password-reset function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: "Произошла ошибка при сбросе пароля",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
