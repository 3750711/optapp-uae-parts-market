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

// Функция проверки подписи Telegram согласно официальной документации
async function verifyTelegramAuth(authData: TelegramAuthData, botToken: string): Promise<boolean> {
  const { hash, ...dataWithoutHash } = authData;
  
  // Проверяем auth_date (данные не должны быть старше 1 дня)
  const authTime = authData.auth_date * 1000; // Конвертируем в миллисекунды
  const now = Date.now();
  const oneDayInMs = 24 * 60 * 60 * 1000;
  
  if (now - authTime > oneDayInMs) {
    console.log('❌ Auth data is too old:', new Date(authTime));
    return false;
  }
  
  // Создаем строку данных для проверки (сортированную по ключу)
  const dataString = Object.keys(dataWithoutHash)
    .sort()
    .filter(key => dataWithoutHash[key as keyof typeof dataWithoutHash] !== undefined)
    .map(key => `${key}=${dataWithoutHash[key as keyof typeof dataWithoutHash]}`)
    .join('\n');
  
  console.log('🔍 Verification data string:', dataString);
  
  // Создаем секретный ключ из токена бота
  const encoder = new TextEncoder();
  const secretKeyData = await crypto.subtle.importKey(
    'raw',
    encoder.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const secretKey = await crypto.subtle.sign('HMAC', secretKeyData, encoder.encode(botToken));
  
  // Создаем HMAC-SHA256 хэш используя секретный ключ
  const hashKeyData = await crypto.subtle.importKey(
    'raw',
    secretKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', hashKeyData, encoder.encode(dataString));
  const expectedHash = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  console.log('🔍 Expected hash:', expectedHash);
  console.log('🔍 Received hash:', hash);
  
  return expectedHash === hash;
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
      return createErrorPageResponse('Invalid Telegram signature', 'The authentication data could not be verified. Please try again.');
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
        return createErrorPageResponse('Account creation failed', 'Could not create your account. Please try again.');
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
      return createErrorPageResponse('Authentication failed', 'Could not generate authentication token. Please try again.');
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
      return createErrorPageResponse('Session error', 'Could not create user session. Please try again.');
    }

    console.log('✅ Session ready');

    // Возвращаем HTML страницу с JavaScript для закрытия popup и передачи данных
    return createSuccessPageResponse({
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
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return createErrorPageResponse('Unexpected error', 'An unexpected error occurred. Please try again.');
  }
}

// Создает HTML страницу для успешной авторизации
function createSuccessPageResponse(data: { user: any; session: any }): Response {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Telegram Login Success</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: #f5f5f5;
        }
        .container {
          text-align: center;
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success { color: #28a745; font-size: 24px; margin-bottom: 16px; }
        .message { color: #666; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success">✅ Authentication Successful</div>
        <div class="message">You can now close this window.</div>
      </div>
      <script>
        try {
          // Send success message to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'TELEGRAM_AUTH_SUCCESS',
              user: ${JSON.stringify(data.user)},
              session: ${JSON.stringify(data.session)}
            }, 'https://partsbay.ae');
            window.close();
          } else {
            console.log('No opener window found');
          }
        } catch (error) {
          console.error('Error sending message to parent:', error);
        }
      </script>
    </body>
    </html>
  `;
  
  return new Response(html, {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'text/html' }
  });
}

// Создает HTML страницу для ошибки авторизации
function createErrorPageResponse(title: string, message: string): Response {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Telegram Login Error</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: #f5f5f5;
        }
        .container {
          text-align: center;
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .error { color: #dc3545; font-size: 24px; margin-bottom: 16px; }
        .message { color: #666; margin-bottom: 20px; }
        .retry { 
          background: #007bff; 
          color: white; 
          border: none; 
          padding: 10px 20px; 
          border-radius: 4px; 
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error">❌ ${title}</div>
        <div class="message">${message}</div>
        <button class="retry" onclick="window.close()">Close Window</button>
      </div>
      <script>
        try {
          // Send error message to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'TELEGRAM_AUTH_ERROR',
              error: '${title}: ${message}'
            }, 'https://partsbay.ae');
          }
        } catch (error) {
          console.error('Error sending message to parent:', error);
        }
      </script>
    </body>
    </html>
  `;
  
  return new Response(html, {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'text/html' }
  });
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

  // Handle GET requests (from Telegram Widget with data-auth-url)
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const searchParams = url.searchParams;
      
      console.log('📝 GET parameters:', Object.fromEntries(searchParams.entries()));
      
      // Extract and decode Telegram auth data from URL parameters
      const telegramData: TelegramAuthData = {
        id: parseInt(searchParams.get('id') || '0'),
        first_name: searchParams.get('first_name') || undefined,
        last_name: searchParams.get('last_name') || undefined,
        username: searchParams.get('username') || undefined,
        photo_url: searchParams.get('photo_url') || undefined,
        auth_date: parseInt(searchParams.get('auth_date') || '0'),
        hash: searchParams.get('hash') || ''
      };
      
      console.log('📝 Parsed Telegram data:', telegramData);
      
      // Validate required fields
      if (!telegramData.id || !telegramData.auth_date || !telegramData.hash) {
        console.log('❌ Missing required fields');
        return createErrorPageResponse(
          'Invalid Request',
          'Missing required Telegram authentication parameters'
        );
      }
      
      // Get bot token from environment
      const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
      if (!botToken) {
        console.log('❌ Bot token not found');
        return createErrorPageResponse(
          'Configuration Error',
          'Telegram bot token not configured'
        );
      }
      
      // Process authentication
      return await handleTelegramAuth(telegramData, botToken);
      
    } catch (error) {
      console.error('❌ Error processing GET request:', error);
      return createErrorPageResponse(
        'Processing Error',
        `Error processing authentication: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Handle POST requests (for compatibility)
  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method);
    return createErrorPageResponse(
      'Invalid Request Method',
      `Only GET and POST requests are supported. Received: ${req.method}`
    );
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