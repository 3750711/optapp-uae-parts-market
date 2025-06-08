
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailVerificationRequest {
  email: string;
  ip_address?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Создаем клиент Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, ip_address }: EmailVerificationRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Email is required" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Получаем IP адрес из заголовков если не передан
    const clientIP = ip_address || req.headers.get("x-forwarded-for")?.split(",")[0] || 
                     req.headers.get("x-real-ip") || "unknown";

    // Вызываем функцию базы данных для генерации кода
    const { data: codeData, error: codeError } = await supabaseClient.rpc(
      'send_verification_code',
      { 
        p_email: email,
        p_ip_address: clientIP
      }
    );

    if (codeError) {
      console.error('Database error:', codeError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Database error",
          message: "Не удалось создать код подтверждения" 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Проверяем результат
    if (!codeData.success) {
      return new Response(
        JSON.stringify(codeData),
        {
          status: 429, // Too Many Requests
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Отправляем email (пока просто логируем код для тестирования)
    // В продакшене здесь должна быть интеграция с Resend или другим email сервисом
    console.log(`Verification code for ${email}: ${codeData.code}`);
    
    // Для демонстрации возвращаем успешный ответ
    // В реальном приложении не возвращайте код в ответе!
    return new Response(
      JSON.stringify({
        success: true,
        message: `Код подтверждения отправлен на ${email}`,
        // Только для тестирования - в продакшене удалить эту строку!
        debug_code: codeData.code 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-email-verification function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        message: "Произошла ошибка при отправке кода" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
