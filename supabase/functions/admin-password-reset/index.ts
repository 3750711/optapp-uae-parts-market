
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
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
    console.log("Admin password reset request received");
    
    const { email, code, newPassword }: PasswordResetRequest = await req.json();
    
    console.log("Processing password reset for:", email);

    // Сначала проверяем код через database функцию
    const { data: verifyData, error: verifyError } = await supabase.rpc('verify_and_reset_password_v2', {
      p_email: email,
      p_code: code,
      p_new_password: newPassword
    });

    console.log("Database verification response:", { verifyData, verifyError });

    if (verifyError) {
      console.error("Database verification error:", verifyError);
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "Ошибка проверки кода",
          error: verifyError.message
        }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json", 
            ...corsHeaders 
          },
        }
      );
    }

    if (!verifyData?.success) {
      console.log("Code verification failed:", verifyData);
      return new Response(
        JSON.stringify({ 
          success: false,
          message: verifyData?.message || "Неверный или истекший код"
        }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json", 
            ...corsHeaders 
          },
        }
      );
    }

    // Если код верен, используем Admin API для изменения пароля
    console.log("Code verified, updating password for user:", verifyData.user_id);
    
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      verifyData.user_id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Password update error:", updateError);
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "Не удалось изменить пароль",
          error: updateError.message
        }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json", 
            ...corsHeaders 
          },
        }
      );
    }

    console.log("Password updated successfully for user:", verifyData.user_id);

    // Логируем событие смены пароля
    try {
      const { error: logError } = await supabase.rpc('log_password_reset_event', {
        p_user_id: verifyData.user_id,
        p_email: email,
        p_opt_id: null // Можно передать OPT ID если есть
      });
      
      if (logError) {
        console.error("Failed to log password reset event:", logError);
      }
    } catch (logErr) {
      console.error("Exception while logging:", logErr);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Пароль успешно изменен"
      }),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );

  } catch (error: any) {
    console.error("Error in admin-password-reset function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: "Произошла внутренняя ошибка сервера",
        error: error.message
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
