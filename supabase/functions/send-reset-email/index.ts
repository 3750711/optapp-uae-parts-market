import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ResetEmailRequest {
  email?: string;
  optId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { email, optId }: ResetEmailRequest = await req.json();
    
    console.log('Password reset request:', { email: email ? 'provided' : 'missing', optId });

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found');
      return new Response(JSON.stringify({ success: true, message: 'If a user with this email exists, they will receive a password reset link.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    let userEmail = email;
    let userOptId = optId;
    let userProfile = null;

    // If OPT ID is provided, find the email
    if (optId && !email) {
      console.log('Looking up email by OPT ID:', optId);
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, opt_id, full_name, telegram_id')
        .eq('opt_id', optId)
        .single();

      if (profile) {
        userEmail = profile.email;
        userProfile = profile;
        console.log('Found user by OPT ID');
      } else {
        console.log('No user found with OPT ID:', optId);
        // Return success anyway (security)
        return new Response(JSON.stringify({ success: true, message: 'If a user with this email exists, they will receive a password reset link.' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!userEmail) {
      return new Response(JSON.stringify({ error: 'Email or OPT ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile if not already fetched
    if (!userProfile) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, opt_id, full_name, telegram_id')
        .eq('email', userEmail)
        .single();
      
      userProfile = profile;
    }

    // Generate reset link using Supabase Auth Admin API
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: userEmail,
      options: {
        redirectTo: `${Deno.env.get('SITE_URL') || 'https://partsbay.ae'}/reset-password`,
      }
    });

    if (resetError) {
      console.error('Error generating reset link:', resetError);
      // Return success anyway (security - don't reveal if user exists)
      return new Response(JSON.stringify({ success: true, message: 'If a user with this email exists, they will receive a password reset link.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resetLink = resetData.properties?.action_link;
    if (!resetLink) {
      console.error('No reset link generated');
      return new Response(JSON.stringify({ success: true, message: 'If a user with this email exists, they will receive a password reset link.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare email content
    const userName = userProfile?.full_name || 'Пользователь';
    const isTelegramUser = !!userProfile?.telegram_id;
    const displayOptId = userProfile?.opt_id || userOptId;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Восстановление пароля - PartsBay</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e9ecef; }
          .footer { background: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background: #fbbf24; color: #1f2937; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .info-box { background: #e0f2fe; border: 1px solid #b3e5fc; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .telegram-badge { background: #0088cc; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #1f2937;">🔐 PartsBay</h1>
            <p style="margin: 5px 0 0 0; color: #666;">Восстановление пароля</p>
          </div>
          
          <div class="content">
            <h2>Привет, ${userName}!</h2>
            
            ${isTelegramUser ? `
              <div class="info-box">
                <p><span class="telegram-badge">TELEGRAM</span> <strong>Пользователь Telegram</strong></p>
                ${displayOptId ? `<p><strong>Ваш OPT ID:</strong> ${displayOptId}</p>` : ''}
                <p>Вы можете установить пароль для входа через email, не теряя доступ через Telegram.</p>
              </div>
            ` : ''}
            
            <p>Мы получили запрос на восстановление пароля для вашего аккаунта.</p>
            
            ${displayOptId ? `<p><strong>OPT ID:</strong> ${displayOptId}</p>` : ''}
            
            <p>Для создания нового пароля нажмите на кнопку ниже:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" class="button">Восстановить пароль</a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              Или скопируйте и вставьте эту ссылку в браузер:<br>
              <a href="${resetLink}" style="word-break: break-all;">${resetLink}</a>
            </p>
            
            <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
              <p style="font-size: 12px; color: #666;">
                • Ссылка действительна в течение 1 часа<br>
                • Если вы не запрашивали восстановление пароля, проигнорируйте это письмо<br>
                • После установки пароля вы сможете входить как через email, так и через Telegram
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2024 PartsBay - Запчасти для автомобилей</p>
            <p>Дубай, ОАЭ | <a href="https://partsbay.ae">partsbay.ae</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via Resend
    const emailResult = await resend.emails.send({
      from: 'PartsBay <noreply@partsbay.ae>',
      to: [userEmail],
      subject: `🔐 Восстановление пароля - PartsBay${displayOptId ? ` (${displayOptId})` : ''}`,
      html: emailHtml,
    });

    console.log('Email sent successfully:', { id: emailResult.data?.id, to: userEmail });

    // Always return success (security - don't reveal if user exists)
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'If a user with this email exists, they will receive a password reset link.' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-reset-email function:', error);
    
    // Return success anyway (security)
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'If a user with this email exists, they will receive a password reset link.' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);