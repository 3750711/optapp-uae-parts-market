
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  resetLink: string;
  optId?: string;
  emailChangeInfo?: {
    oldEmail: string;
    newEmail: string;
    type: 'email_change_notification';
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Password reset request received");
    
    const { email, resetLink, optId, emailChangeInfo }: PasswordResetRequest = await req.json();
    
    console.log("Processing request for:", email);
    console.log("Request type:", emailChangeInfo ? "Email change notification" : "Password reset");

    let htmlContent: string;
    let subject: string;

    if (emailChangeInfo && emailChangeInfo.type === 'email_change_notification') {
      // HTML шаблон для уведомления об изменении email
      subject = "🔄 Изменение email адреса - PartsBay.ae";
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Изменение email - PartsBay.ae</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
              .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
              .info-box { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🔄 Email изменен</h1>
              <p>PartsBay.ae - Автозапчасти из ОАЭ</p>
            </div>
            
            <div class="content">
              <h2>Изменение email адреса</h2>
              
              <p>Мы уведомляем вас о том, что email адрес вашего аккаунта на PartsBay.ae был изменен.</p>
              
              <div class="info-box">
                <p><strong>Старый email:</strong> ${emailChangeInfo.oldEmail}</p>
                <p><strong>Новый email:</strong> ${emailChangeInfo.newEmail}</p>
                <p><strong>Дата изменения:</strong> ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Dubai' })}</p>
              </div>
              
              <div class="warning">
                <strong>⚠️ Важно:</strong>
                <ul>
                  <li>Если вы не производили это изменение, немедленно свяжитесь с нами</li>
                  <li>Это письмо отправлено на ваш предыдущий email адрес для безопасности</li>
                  <li>Все дальнейшие уведомления будут приходить на новый адрес</li>
                </ul>
              </div>
              
              <p>Если у вас есть вопросы или подозрения о безопасности аккаунта, обратитесь в нашу службу поддержки.</p>
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
      // HTML шаблон для сброса пароля (существующий код)
      subject = "🔐 Сброс пароля - PartsBay.ae";
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
              .button { display: inline-block; background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .button:hover { background: #d97706; }
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
              
              <p>Чтобы создать новый пароль, нажмите на кнопку ниже:</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Создать новый пароль</a>
              </div>
              
              <p><strong>Или скопируйте и вставьте эту ссылку в браузер:</strong></p>
              <p style="word-break: break-all; background: #f9fafb; padding: 10px; border-radius: 5px; font-family: monospace;">
                ${resetLink}
              </p>
              
              <div class="warning">
                <strong>⚠️ Важно:</strong>
                <ul>
                  <li>Ссылка действительна в течение 1 часа</li>
                  <li>Если вы не запрашивали сброс пароля, проигнорируйте это письмо</li>
                  <li>Никому не передавайте эту ссылку</li>
                </ul>
              </div>
              
              <p>После создания нового пароля вы сможете войти в систему с новыми учетными данными.</p>
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
        message: emailChangeInfo ? "Email change notification sent successfully" : "Password reset email sent successfully",
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
    let errorMessage = "Failed to send email";
    let statusCode = 500;
    
    if (error.message?.includes("Invalid")) {
      errorMessage = "Invalid email address";
      statusCode = 400;
    } else if (error.message?.includes("rate limit")) {
      errorMessage = "Too many requests. Please try again later.";
      statusCode = 429;
    } else if (error.message?.includes("domain")) {
      errorMessage = "Email domain not verified";
      statusCode = 422;
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
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
