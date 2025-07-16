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

// Этап 1: Исправленный алгоритм проверки подписи для Login Widget
async function verifyTelegramAuth(authData: TelegramAuthData, botToken: string): Promise<boolean> {
  try {
    const { hash, ...dataWithoutHash } = authData;
    
    console.log('🔐 Starting Login Widget signature verification...');
    console.log('📝 Auth data received:', JSON.stringify(authData, null, 2));
    
    // Проверяем auth_date (данные не должны быть старше 1 дня)
    const authTime = authData.auth_date * 1000;
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    if (now - authTime > oneDayInMs) {
      console.log('❌ Auth data is too old:', new Date(authTime));
      return false;
    }
    
    console.log('✅ Auth date is valid');
    
    // Фильтруем и сортируем данные, исключаем undefined, null и пустые значения
    const dataKeys = Object.keys(dataWithoutHash)
      .filter(key => {
        const value = dataWithoutHash[key as keyof typeof dataWithoutHash];
        return value !== undefined && value !== null && value !== '' && String(value).trim() !== '';
      })
      .sort();
    
    console.log('🔍 Data keys for verification:', dataKeys);
    
    // Создаем строку данных в формате key=value\nkey=value для Login Widget
    const dataCheckString = dataKeys
      .map(key => `${key}=${dataWithoutHash[key as keyof typeof dataWithoutHash]}`)
      .join('\n');
    
    console.log('🔍 Data check string:', dataCheckString);
    
    // Прямая подпись bot_token'ом согласно стандарту Login Widget
    const encoder = new TextEncoder();
    
    // Используем bot token напрямую как ключ (НЕ двухступенчатый HMAC!)
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(botToken),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(dataCheckString));
    const expectedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    console.log('🔍 Received hash:', hash);
    console.log('🔍 Expected hash:', expectedHash);
    console.log('🔍 Hash match:', hash === expectedHash);
    
    return hash === expectedHash;
    
  } catch (error) {
    console.error('❌ Error in signature verification:', error);
    return false;
  }
}

// Генерация email для Telegram пользователя
function generateTelegramEmail(telegramId: number): string {
  return `telegram.${telegramId}@partsbay.ae`;
}

// Генерация временного пароля
function generateTemporaryPassword(): string {
  return `tg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// Генерация полного имени
function generateFullName(telegramData: TelegramAuthData): string {
  const firstName = telegramData.first_name || '';
  const lastName = telegramData.last_name || '';
  return `${firstName} ${lastName}`.trim() || telegramData.username || `User ${telegramData.id}`;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Method not allowed' 
    }), { 
      status: 405, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log('🚀 Starting Telegram authentication...');
    
    const { telegramData } = await req.json();
    
    if (!telegramData || !telegramData.id || !telegramData.hash) {
      console.log('❌ Invalid Telegram data received');
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid Telegram authentication data'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('📝 Received Telegram data:', {
      id: telegramData.id,
      first_name: telegramData.first_name,
      username: telegramData.username,
      auth_date: telegramData.auth_date
    });

    // Получаем bot token
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      console.log('❌ Bot token not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'Telegram bot token not configured'
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Проверяем подпись
    console.log('🔐 Verifying Telegram signature...');
    const isValid = await verifyTelegramAuth(telegramData, botToken);
    
    if (!isValid) {
      console.log('❌ Invalid Telegram signature');
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid Telegram signature'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Telegram signature verified');

    // Инициализируем Supabase клиенты
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Admin client для создания пользователей
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    // Обычный клиент для логина
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Этап 4: Улучшенная проверка на replay атаки с детальным логированием
    console.log('🔍 Checking for replay attacks...');
    console.log('📋 Checking for telegram_id:', telegramData.id, 'auth_date:', telegramData.auth_date);
    
    const { data: existingLog, error: logError } = await supabaseAdmin
      .from('telegram_auth_logs')
      .select('id, created_at')
      .eq('telegram_id', telegramData.id)
      .eq('auth_date', telegramData.auth_date)
      .single();

    if (logError && logError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Error checking replay logs:', logError);
      throw new Error('Failed to verify request authenticity');
    }

    if (existingLog) {
      console.log('❌ Replay attack detected - auth already used at:', existingLog.created_at);
      throw new Error('This authentication request has already been used');
    }

    console.log('✅ No replay attack detected');

    // Записываем лог с детальной информацией
    console.log('📝 Recording authentication log...');
    const { error: insertLogError } = await supabaseAdmin
      .from('telegram_auth_logs')
      .insert({
        telegram_id: telegramData.id,
        auth_date: telegramData.auth_date,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });

    if (insertLogError) {
      console.error('⚠️ Warning: Failed to record auth log:', insertLogError);
      // Не останавливаемся, так как основная аутентификация прошла успешно
    } else {
      console.log('✅ Authentication log recorded');
    }

    const telegramEmail = generateTelegramEmail(telegramData.id);
    const fullName = generateFullName(telegramData);
    const temporaryPassword = generateTemporaryPassword();

    console.log('📧 Generated email:', telegramEmail);

    // Проверяем, существует ли пользователь
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(telegramEmail);

    let userId: string;

    if (existingUser?.user) {
      console.log('👤 Existing user found:', existingUser.user.id);
      userId = existingUser.user.id;
      
      // Обновляем пароль для существующего пользователя
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: temporaryPassword }
      );
      
      if (updateError) {
        console.error('❌ Error updating user password:', updateError);
        throw updateError;
      }
    } else {
      console.log('👤 Creating new user...');
      
      // Создаем нового пользователя
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: telegramEmail,
        password: temporaryPassword,
        email_confirm: true, // Подтверждаем email автоматически
        user_metadata: {
          full_name: fullName,
          telegram_id: telegramData.id,
          telegram_username: telegramData.username,
          telegram_first_name: telegramData.first_name,
          telegram_last_name: telegramData.last_name,
          telegram_photo_url: telegramData.photo_url,
          auth_method: 'telegram'
        }
      });

      if (createError || !newUser.user) {
        console.error('❌ Error creating user:', createError);
        throw createError;
      }

      userId = newUser.user.id;
      console.log('✅ New user created:', userId);
    }

    // Входим в систему с временным паролем
    console.log('🔐 Signing in user...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: telegramEmail,
      password: temporaryPassword
    });

    if (signInError || !signInData.session) {
      console.error('❌ Error signing in user:', signInError);
      throw signInError;
    }

    console.log('✅ User signed in successfully');

    // Обновляем профиль пользователя
    console.log('👤 Updating user profile...');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        email: telegramEmail,
        telegram_id: telegramData.id,
        telegram_username: telegramData.username,
        telegram_first_name: telegramData.first_name,
        telegram_photo_url: telegramData.photo_url,
        auth_method: 'telegram',
        email_confirmed: true,
        first_login_completed: true,
        profile_completed: true
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('❌ Error updating profile:', profileError);
      // Не останавливаемся на ошибке профиля, так как пользователь уже создан
    } else {
      console.log('✅ Profile updated successfully');
    }

    // Возвращаем успешный результат с сессией
    return new Response(JSON.stringify({
      success: true,
      user: signInData.user,
      session: signInData.session,
      profile: {
        id: userId,
        full_name: fullName,
        email: telegramEmail,
        telegram_id: telegramData.id,
        telegram_username: telegramData.username,
        auth_method: 'telegram'
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in Telegram authentication:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});