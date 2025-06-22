
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailVerificationRequest {
  email: string;
  verification_code?: string; // Код передается из базы данных
  ip_address?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, verification_code, ip_address }: EmailVerificationRequest = await req.json();

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

    // Если код не передан, значит нужно сгенерировать его через базу данных
    let codeToSend = verification_code;
    
    if (!codeToSend) {
      // Создаем клиент Supabase для генерации кода
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Получаем IP адрес
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

      codeToSend = codeData.code;
    }

    // Создаем клиент Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Отправляем email с кодом
    try {
      const emailResponse = await resend.emails.send({
        from: "PartsBay.ae <noreply@partsbay.ae>",
        to: [email],
        subject: "Код подтверждения email - PartsBay.ae",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f59e0b; margin: 0;">PartsBay.ae</h1>
              <p style="color: #666; margin: 5px 0;">Автозапчасти из ОАЭ</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; text-align: center;">
              <h2 style="color: #333; margin-bottom: 20px;">Подтверждение email адреса</h2>
              <p style="color: #666; margin-bottom: 30px;">
                Введите этот код на сайте для подтверждения вашего email адреса:
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #f59e0b; display: inline-block;">
                <span style="font-size: 32px; font-weight: bold; color: #f59e0b; letter-spacing: 5px;">
                  ${codeToSend}
                </span>
              </div>
              
              <p style="color: #999; margin-top: 30px; font-size: 14px;">
                Код действителен в течение 5 минут
              </p>
            </div>
            
            <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #999;">
              <p>Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
              <p>© 2024 PartsBay.ae - Все права защищены</p>
            </div>
          </div>
        `,
      });

      console.log("Email sent successfully:", emailResponse);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Код подтверждения отправлен на ${email}`,
          email_id: emailResponse.data?.id
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );

    } catch (emailError: any) {
      console.error("Error sending email:", emailError);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Email sending failed",
          message: "Не удалось отправить код на email. Попробуйте позже." 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

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
