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

// Функция обработки Telegram авторизации через готовую сессию
async function handleTelegramAuth(telegramData: TelegramAuthData): Promise<Response> {
  console.log('🚀 Starting Telegram auth with session...');
  console.log('📱 Telegram ID:', telegramData.id);
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;

  // Создаем admin клиент для управления пользователями
  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
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

    // 2. Генерируем email и данные пользователя
    const email = generateEmailFromTelegram(telegramData);
    const fullName = generateFullName(telegramData);
    
    console.log('📧 Generated email:', email);
    console.log('👤 Generated name:', fullName);

    // 3. Проверяем/создаем пользователя
    const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(user => user.email === email);
    
    if (!existingUser) {
      console.log('👤 Creating new user...');
      const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
        email,
        email_confirm: true,
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

    // 4. Создаем сессию для пользователя
    console.log('🎫 Creating session...');
    const { data: sessionData, error: sessionError } = await adminSupabase.auth.admin.createSession({
      provider_token: null,
      provider_refresh_token: null
    });

    if (sessionError) {
      console.error('❌ Session creation failed:', sessionError);
      // Fallback: генерируем access token через generateLink
      console.log('🔄 Trying generateLink approach...');
      const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
        type: 'magiclink',
        email
      });

      if (linkError) {
        console.error('❌ Link generation failed:', linkError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to create session'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Возвращаем токены из магической ссылки
      return new Response(JSON.stringify({
        success: true,
        user: {
          id: linkData.user.id,
          email: linkData.user.email,
          user_metadata: linkData.user.user_metadata
        },
        session: {
          access_token: linkData.session?.access_token || '',
          refresh_token: linkData.session?.refresh_token || '',
          expires_in: linkData.session?.expires_in || 3600,
          token_type: linkData.session?.token_type || 'bearer'
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Session created');

    // 5. Возвращаем готовую сессию
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: sessionData.user.id,
        email: sessionData.user.email,
        user_metadata: sessionData.user.user_metadata
      },
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_in: sessionData.session.expires_in,
        token_type: sessionData.session.token_type
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