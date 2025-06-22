
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  optId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Password reset request received");
    
    const { email, optId }: PasswordResetRequest = await req.json();
    
    console.log("Processing password reset for:", email, "optId:", optId);

    if (!email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email обязателен" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Создаем код сброса пароля через функцию базы данных
    const { data: codeResult, error: codeError } = await supabase.rpc(
      'create_password_reset_code',
      { 
        p_email: email,
        p_opt_id: optId || null
      }
    );

    if (codeError) {
      console.error("Database error:", codeError);
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "Не удалось создать код сброса пароля",
          details: codeError.message 
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

    if (!codeResult.success) {
      return new Response(
        JSON.stringify(codeResult),
        {
          status: 429, // Too Many Requests
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resetCode = codeResult.code;
    console.log("Generated reset code:", resetCode ? "***" : "empty");

    // HTML шаблон для сброса пароля с кодом
    const subject = "🔐 Код для сброса пароля - PartsBay.ae";
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Сброс пароля - PartsBay.ae</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
            .code-box { background: #f0f9ff; border: 2px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0369a1; font-family: monospace; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .info-box { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 Сброс пароля</h1>
            <p>PartsBay.ae - Автозапчасти из ОАЭ</p>
          </div>
          
          <div class="content">
            <h2>Здравствуйте!</h2>
            
            <p>Мы получили запрос на сброс пароля для вашего аккаунта на PartsBay.ae.</p>
            
            ${optId ? `
            <div class="info-box">
              <strong>Ваш OPT ID:</strong> ${optId}
            </div>
            ` : ''}
            
            <p>Ваш код для сброса пароля:</p>
            
            <div class="code-box">
              <div class="code">${resetCode}</div>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
                Введите этот код на странице сброса пароля
              </p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Важно:</strong>
              <ul>
                <li>Код действителен в течение 10 минут</li>
                <li>Если вы не запрашивали сброс пароля, проигнорируйте это письмо</li>
                <li>Никому не передавайте этот код</li>
                <li>Код можно использовать только один раз</li>
              </ul>
            </div>
            
            <p>Перейдите на страницу <a href="https://partsbay.ae/forgot-password">сброса пароля</a> и введите код выше для создания нового пароля.</p>
          </div>
          
          <div class="footer">
            <p><strong>PartsBay.ae</strong></p>
            <p>Автозапчасти из ОАЭ с доставкой по всему миру</p>
            <p style="font-size: 12px; color: #6b7280;">
              Если у вас есть вопросы, свяжитесь с нами через сайт или Telegram.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "PartsBay.ae <noreply@partsbay.ae>",
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Код для сброса пароля отправлен на email",
        emailId: emailResponse.data?.id 
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    
    // Determine error type for better user feedback
    let errorMessage = "Не удалось отправить код";
    let statusCode = 500;
    
    if (error.message?.includes("Invalid")) {
      errorMessage = "Неверный email адрес";
      statusCode = 400;
    } else if (error.message?.includes("rate limit")) {
      errorMessage = "Слишком много запросов. Попробуйте позже.";
      statusCode = 429;
    } else if (error.message?.includes("domain")) {
      errorMessage = "Email домен не верифицирован";
      statusCode = 422;
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: errorMessage,
        details: error.message 
      }),
      {
        status: statusCode,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
