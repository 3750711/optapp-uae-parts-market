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

// Функция обработки Telegram авторизации через Magic Links
async function handleTelegramAuth(telegramData: TelegramAuthData, botToken: string): Promise<Response> {
  console.log('🚀 Starting Telegram auth with Magic Links...');
  console.log('📱 Telegram ID:', telegramData.id);
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Создаем клиенты
  const publicSupabase = createClient(supabaseUrl, supabaseAnonKey);
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

    // 3. Проверяем существует ли пользователь
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

    // 4. Генерируем Magic Link для создания сессии
    console.log('🔗 Generating magic link...');
    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email
    });

    if (linkError) {
      console.error('❌ Magic link generation failed:', linkError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to generate authentication link'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Magic link generated successfully');

    // 5. Создаем и сохраняем профиль пользователя если это новый пользователь
    if (!existingUser) {
      console.log('👤 Creating user profile...');
      const userId = linkData.user.id;
      
      const { error: profileError } = await adminSupabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          full_name: fullName,
          auth_method: 'telegram',
          telegram_id: telegramData.id,
          telegram_username: telegramData.username,
          telegram_first_name: telegramData.first_name,
          telegram_photo_url: telegramData.photo_url,
          user_type: 'buyer',
          verification_status: 'verified',
          first_login_completed: true,
          profile_completed: true
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('❌ Profile creation failed:', profileError);
        // Не прерываем процесс, так как пользователь уже создан
      } else {
        console.log('✅ Profile created');
      }
    }

    // 6. Возвращаем сессию из Magic Link
    const session = linkData.session;
    if (!session) {
      console.error('❌ No session in magic link response');
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create session'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Session ready');

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: linkData.user.id,
        email: linkData.user.email,
        user_metadata: linkData.user.user_metadata
      },
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        token_type: session.token_type,
        expires_at: session.expires_at
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
      // Form data format - handle properly for Telegram Widget
      const text = await req.text();
      const params = new URLSearchParams(text);
      telegramData = {
        id: parseInt(params.get('id') as string),
        first_name: params.get('first_name') || undefined,
        last_name: params.get('last_name') || undefined,
        username: params.get('username') || undefined,
        photo_url: params.get('photo_url') || undefined,
        auth_date: parseInt(params.get('auth_date') as string),
        hash: params.get('hash') as string
      };
      console.log('✅ Parsed as form-urlencoded data');
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

    // Check if bot token is available
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
      return new Response(JSON.stringify({
        success: false,
        error: 'Server configuration error',
        details: 'Missing bot token'
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return await handleTelegramAuth(telegramData, botToken);
    
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