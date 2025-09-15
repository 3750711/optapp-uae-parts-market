
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createServiceClient } from '../_shared/client.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createServiceClient();

// Константа для базового URL
const PARTSBAY_BASE_URL = "https://partsbay.ae";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  optId?: string;
  resetLink?: string;
  emailChangeInfo?: {
    oldEmail: string;
    newEmail: string;
    type: 'email_change_notification' | 'email_change_success';
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Email request received");
    
    const { email, optId, resetLink, emailChangeInfo }: EmailRequest = await req.json();
    
    console.log("Processing email for:", email, "type:", emailChangeInfo?.type || "password_reset");

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

    let subject: string;
    let htmlContent: string;

    // Определяем тип уведомления и создаем соответствующий контент
    if (emailChangeInfo?.type === 'email_change_notification') {
      // Уведомление на старый email о том, что email был изменен
      subject = "🔐 Ваш email был изменен - PartsBay.ae";
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email изменен - PartsBay.ae</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
              .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
              .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .info-box { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 15px; border-radius: 8px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🔐 Email изменен</h1>
              <p>PartsBay.ae - Автозапчасти из ОАЭ</p>
            </div>
            
            <div class="content">
              <h2>Здравствуйте!</h2>
              
              <p>Мы уведомляем вас о том, что email адрес вашего аккаунта на PartsBay.ae был изменен.</p>
              
              <div class="info-box">
                <strong>Детали изменения:</strong>
                <ul>
                  <li><strong>Старый email:</strong> ${emailChangeInfo.oldEmail}</li>
                  <li><strong>Новый email:</strong> ${emailChangeInfo.newEmail}</li>
                  <li><strong>Дата изменения:</strong> ${new Date().toLocaleString('ru-RU')}</li>
                </ul>
              </div>
              
              <div class="warning">
                <strong>⚠️ Если это были не вы:</strong>
                <ul>
                  <li>Немедленно свяжитесь с нашей поддержкой</li>
                  <li>Проверьте безопасность вашего аккаунта</li>
                  <li>Смените пароль если есть подозрения на взлом</li>
                </ul>
              </div>
              
              <p>Если вы изменили email самостоятельно, можете проигнорировать это письмо.</p>
              
              <p>Для управления аккаунтом перейдите в <a href="${PARTSBAY_BASE_URL}/profile">личный кабинет</a>.</p>
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
    } else if (emailChangeInfo?.type === 'email_change_success') {
      // Приветственное уведомление на новый email
      subject = "🎉 Добро пожаловать! Email успешно изменен - PartsBay.ae";
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Добро пожаловать - PartsBay.ae</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
              .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
              .success-box { background: #f0fdf4; border: 1px solid #22c55e; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .info-box { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 15px; border-radius: 8px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎉 Добро пожаловать!</h1>
              <p>PartsBay.ae - Автозапчасти из ОАЭ</p>
            </div>
            
            <div class="content">
              <h2>Email успешно изменен!</h2>
              
              <div class="success-box">
                <strong>✅ Поздравляем!</strong>
                <p>Ваш email адрес был успешно изменен на: <strong>${emailChangeInfo.newEmail}</strong></p>
                <p>Теперь вы будете получать все уведомления на этот адрес.</p>
              </div>
              
              <div class="info-box">
                <strong>Что дальше?</strong>
                <ul>
                  <li>Все уведомления о заказах будут приходить на новый email</li>
                  <li>Для входа в аккаунт используйте новый email адрес</li>
                  <li>Ваши данные профиля и история заказов сохранены</li>
                </ul>
              </div>
              
              <p>Добро пожаловать в PartsBay.ae! Мы рады, что вы с нами.</p>
              
              <p><strong>Что мы предлагаем:</strong></p>
              <ul>
                <li>🚗 Широкий выбор автозапчастей из ОАЭ</li>
                <li>🌍 Доставка по всему миру</li>
                <li>💰 Выгодные цены от проверенных поставщиков</li>
                <li>🔧 Помощь в подборе запчастей</li>
              </ul>
              
              <p>Начните поиск запчастей прямо сейчас на <a href="${PARTSBAY_BASE_URL}">partsbay.ae</a></p>
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
    } else {
      // Стандартное уведомление о сбросе пароля
      console.log("Password reset requested for email:", email, "optId:", optId || "none");

      // Get client IP and user agent for security logging and rate limiting
      const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';

      // Check IP-based rate limit (10 attempts per hour per IP)
      const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc('check_ip_rate_limit', {
        p_ip_address: clientIP,
        p_action: 'password_reset_request',
        p_limit: 10,
        p_window_minutes: 60
      });

      if (rateLimitError || !rateLimitCheck?.allowed) {
        await supabase.rpc('log_security_event', {
          p_action: 'password_reset_rate_limit',
          p_user_id: null,
          p_ip_address: clientIP,
          p_user_agent: userAgent,
          p_error_message: 'IP rate limit exceeded',
          p_details: {
            reason: 'IP rate limit exceeded',
            limit: 10,
            window_minutes: 60,
            remaining: rateLimitCheck?.remaining || 0,
            email: email
          }
        });

        return new Response(
          JSON.stringify({
            success: false,
            message: 'Слишком много попыток с вашего IP-адреса. Попробуйте позже.'
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Validate user exists before creating reset code
      const { data: userProfile, error: validationError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single();

      if (validationError || !userProfile) {
        console.error("User validation error:", validationError);
        
        // Log security event
        await supabase.rpc('log_security_event', {
          p_action: 'password_reset_nonexistent_user',
          p_user_id: null,
          p_ip_address: clientIP,
          p_user_agent: userAgent,
          p_error_message: validationError?.message || 'User does not exist',
          p_details: {
            email: email,
            validation_error: validationError?.message
          }
        });

        return new Response(
          JSON.stringify({ 
            success: true, // Return success to prevent email enumeration
            message: "Если этот email существует, код для сброса пароля будет отправлен"
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // User exists, proceed with creating reset code

      const { data: codeResult, error: codeError } = await supabase.rpc(
        'send_password_reset_code',
        { 
          p_email: email,
          p_opt_id: optId || null
        }
      );

      if (codeError) {
        console.error("Database error:", codeError);
        
        // Log security event
        await supabase.rpc('log_security_event', {
          p_action: 'password_reset_code_creation_error',
          p_user_id: userProfile.id,
          p_ip_address: clientIP,
          p_user_agent: userAgent,
          p_error_message: codeError.message,
          p_details: {
            email: email,
            opt_id: optId
          }
        });

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

      const resetCode = codeResult?.code || codeResult;

      if (!resetCode) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Слишком много попыток. Попробуйте позже."
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Log successful code creation
      await supabase.rpc('log_security_event', {
        p_action: 'password_reset_code_created',
        p_user_id: userProfile.id,
        p_ip_address: clientIP,
        p_user_agent: userAgent,
        p_error_message: null,
        p_details: {
          email: email,
          opt_id: optId,
          code_length: resetCode.length
        }
      });
      console.log("Generated reset code:", resetCode ? "***" : "empty");

      // HTML шаблон для сброса пароля с кодом
      subject = "🔐 Код для сброса пароля - PartsBay.ae";
      htmlContent = `
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
              
              <p>Перейдите на страницу <a href="${PARTSBAY_BASE_URL}/forgot-password">сброса пароля</a> и введите код выше для создания нового пароля.</p>
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
    }

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
        message: emailChangeInfo ? "Уведомление отправлено" : "Код для сброса пароля отправлен на email",
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
    let errorMessage = "Не удалось отправить email";
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
