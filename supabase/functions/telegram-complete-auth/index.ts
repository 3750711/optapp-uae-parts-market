import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramAuthData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Функция генерации email из Telegram данных
function generateEmailFromTelegram(telegramData: TelegramAuthData): string {
  const telegramId = telegramData.id.toString();
  const username = telegramData.username || 'user';
  return `${username}.${telegramId}@telegram.partsbay.ae`;
}

// Функция генерации полного имени
function generateFullName(telegramData: TelegramAuthData): string {
  const firstName = telegramData.first_name || '';
  const lastName = telegramData.last_name || '';
  return `${firstName} ${lastName}`.trim() || telegramData.username || `User ${telegramData.id}`;
}

// Функция проверки подписи Telegram
async function verifyTelegramAuth(authData: TelegramAuthData, botToken: string): Promise<boolean> {
  const hash = authData.hash;
  const dataCheckString = Object.keys(authData)
    .filter(key => key !== 'hash')
    .sort()
    .map(key => `${key}=${authData[key as keyof TelegramAuthData]}`)
    .join('\n');

  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    'raw',
    await crypto.subtle.digest('SHA-256', encoder.encode(botToken)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(dataCheckString));
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex === hash;
}

// Упрощенная функция обработки Telegram авторизации через Magic Links
async function handleTelegramAuth(telegramData: TelegramAuthData): Promise<Response> {
  console.log('🚀 Starting simplified Telegram auth...');
  console.log('📱 Telegram ID:', telegramData.id);
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // 1. Проверяем подпись Telegram
    console.log('🔐 Verifying Telegram signature...');
    const isValid = await verifyTelegramAuth(telegramData, botToken);
    if (!isValid) {
      console.log('❌ Invalid Telegram signature');
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid Telegram signature'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.log('✅ Signature verified');

    // 2. Генерируем email для пользователя
    const email = generateEmailFromTelegram(telegramData);
    const fullName = generateFullName(telegramData);
    
    console.log('📧 Generated email:', email);
    console.log('👤 Generated name:', fullName);

    // 3. Используем Magic Link подход - создаем сессию через OTP
    console.log('🔗 Creating magic link session...');
    
    // Сначала проверяем существует ли пользователь
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(user => user.email === email);
    
    if (!userExists) {
      console.log('👤 Creating new user via Admin API...');
      // Создаем пользователя через Admin API, если его нет
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true, // Подтверждаем email сразу
        user_metadata: {
          auth_method: 'telegram',
          telegram_id: telegramData.id,
          telegram_username: telegramData.username,
          telegram_first_name: telegramData.first_name,
          telegram_photo_url: telegramData.photo_url,
          full_name: fullName
        }
      });

      if (createError) {
        console.error('❌ User creation failed:', createError);
        return new Response(JSON.stringify({
          success: false,
          error: createError.message
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log('✅ User created:', newUser.user?.id);
    } else {
      console.log('👤 User already exists');
    }

    // 4. Генерируем Magic Link для входа
    console.log('🎫 Generating magic link...');
    const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${Deno.env.get('SITE_URL') || 'https://partsbay.ae'}/`
      }
    });

    if (magicLinkError) {
      console.error('❌ Magic link generation failed:', magicLinkError);
      return new Response(JSON.stringify({
        success: false,
        error: magicLinkError.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Magic link generated');

    // 5. Возвращаем результат с access_token и refresh_token
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: magicLinkData.user.id,
        email: magicLinkData.user.email,
        user_metadata: magicLinkData.user.user_metadata
      },
      session: {
        access_token: magicLinkData.session?.access_token,
        refresh_token: magicLinkData.session?.refresh_token,
        expires_in: magicLinkData.session?.expires_in,
        token_type: magicLinkData.session?.token_type
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

serve(async (req: Request) => {
  console.log('🚀 Telegram auth request received');
  console.log('📝 Method:', req.method);
  console.log('📝 Content-Type:', req.headers.get('content-type'));
  console.log('📝 URL:', req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('⚡ CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method);
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), { 
      status: 405, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log('📝 Reading request body...');
    const contentType = req.headers.get('content-type') || '';
    
    let telegramData: TelegramAuthData;
    
    if (contentType.includes('application/json')) {
      // JSON format
      telegramData = await req.json();
      console.log('✅ Parsed as JSON');
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // Form data format
      const formData = await req.formData();
      telegramData = {
        id: parseInt(formData.get('id') as string),
        first_name: formData.get('first_name') as string || undefined,
        last_name: formData.get('last_name') as string || undefined,
        username: formData.get('username') as string || undefined,
        photo_url: formData.get('photo_url') as string || undefined,
        auth_date: parseInt(formData.get('auth_date') as string),
        hash: formData.get('hash') as string
      };
      console.log('✅ Parsed as form data');
    } else {
      // Try to parse as text and then as JSON
      const rawBody = await req.text();
      console.log('📝 Raw body:', rawBody.substring(0, 200));
      
      try {
        telegramData = JSON.parse(rawBody);
        console.log('✅ Parsed raw text as JSON');
      } catch (parseError) {
        console.error('❌ Parse error:', parseError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid request format',
          contentType,
          bodyPreview: rawBody.substring(0, 100)
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    console.log('📋 Telegram data received:', {
      id: telegramData.id,
      username: telegramData.username,
      hasHash: !!telegramData.hash
    });

    return await handleTelegramAuth(telegramData);
    
  } catch (error) {
    console.error('❌ Request processing error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Request processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});