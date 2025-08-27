import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    first_name: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  date: number;
  text?: string;
  photo?: TelegramPhotoSize[];
  document?: TelegramDocument;
}

interface TelegramPhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

interface TelegramDocument {
  file_name?: string;
  mime_type?: string;
  file_id: string;
  file_unique_id: string;
  file_size?: number;
}

// Database functions for user sessions
async function storeUserSession(supabase: any, userId: number, orderId: string) {
  // Clean up expired sessions first
  await supabase.from('telegram_user_sessions').delete().lt('expires_at', new Date().toISOString());
  
  // Delete existing session for this user
  await supabase.from('telegram_user_sessions').delete().eq('user_id', userId);
  
  // Insert new session
  const { error } = await supabase
    .from('telegram_user_sessions')
    .insert({
      user_id: userId,
      order_id: orderId
    });
    
  if (error) {
    console.error('Error storing user session:', error);
    throw error;
  }
}

async function getUserSession(supabase: any, userId: number): Promise<string | null> {
  // Clean up expired sessions first
  await supabase.from('telegram_user_sessions').delete().lt('expires_at', new Date().toISOString());
  
  const { data, error } = await supabase
    .from('telegram_user_sessions')
    .select('order_id')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .single();
    
  if (error || !data) {
    return null;
  }
  
  return data.order_id;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const cloudinaryCloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const cloudinaryApiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const cloudinaryApiSecret = Deno.env.get('CLOUDINARY_API_SECRET');
    const cloudinaryUploadPreset = Deno.env.get('CLOUDINARY_UPLOAD_PRESET');

    // Validate all required environment variables
    if (!supabaseUrl || !supabaseServiceKey || !telegramBotToken) {
      throw new Error('Missing required Supabase/Telegram environment variables');
    }

    if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret || !cloudinaryUploadPreset) {
      console.error('Missing Cloudinary environment variables:', {
        CLOUDINARY_CLOUD_NAME: !!cloudinaryCloudName,
        CLOUDINARY_API_KEY: !!cloudinaryApiKey,
        CLOUDINARY_API_SECRET: !!cloudinaryApiSecret,
        CLOUDINARY_UPLOAD_PRESET: !!cloudinaryUploadPreset
      });
      throw new Error('Missing required Cloudinary environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const update: TelegramUpdate = await req.json();
    console.log('Received Telegram update:', JSON.stringify(update, null, 2));

    const message = update.message;
    if (!message) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = message.from.id;
    const chatId = message.chat.id;
    const chatType = message.chat.type;

    // Log chat information for debugging
    console.log(`Chat info: ID=${chatId}, Type=${chatType}, User=${userId}`);

    // Handle /start command with order_ID (only in private chats)
    if (message.text?.startsWith('/start order_')) {
      // Only process /start commands in private chats
      if (chatType !== 'private') {
        console.log(`Ignoring /start command from non-private chat: ${chatType}`);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const orderId = message.text.replace('/start order_', '');
      console.log(`User ${userId} linked to order ${orderId} in private chat`);
      
      try {
        // Store user session in database
        await storeUserSession(supabase, userId, orderId);
        
        // Send confirmation message
        await sendTelegramMessage(telegramBotToken, chatId, 
          `✅ Привет! Теперь ты можешь отправлять фотографии для заказа #${orderId}.\n\nПросто отправь фотографии в этот чат, и они автоматически сохранятся в системе.`
        );
      } catch (error) {
        console.error('Error storing user session:', error);
        await sendTelegramMessage(telegramBotToken, chatId, 
          '❌ Произошла ошибка при привязке к заказу. Попробуйте еще раз.'
        );
      }
      
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle photos (only in private chats)
    if (message.photo && message.photo.length > 0) {
      // Only process photos from private chats
      if (chatType !== 'private') {
        console.log(`Ignoring photo from non-private chat: ${chatType} (Chat ID: ${chatId})`);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Processing photo from user ${userId} in private chat`);
      
      try {
        const activeOrderId = await getUserSession(supabase, userId);
        
        if (!activeOrderId) {
          await sendTelegramMessage(telegramBotToken, chatId, 
            '❌ Сначала нужно перейти по ссылке из админки для привязки к заказу.\n\nВы получите ссылку в личном сообщении от администратора.'
          );
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get the highest resolution photo
        const bestPhoto = message.photo.reduce((prev, current) => 
          (current.file_size || 0) > (prev.file_size || 0) ? current : prev
        );

        // Download photo from Telegram
        const fileUrl = await getTelegramFileUrl(telegramBotToken, bestPhoto.file_id);
        const photoBuffer = await downloadTelegramFile(fileUrl);

        // Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(
          photoBuffer, 
          activeOrderId, 
          cloudinaryCloudName!, 
          cloudinaryApiKey!, 
          cloudinaryApiSecret!,
          cloudinaryUploadPreset!
        );

        // Save to database
        const { error: dbError } = await supabase
          .from('order_media')
          .insert({
            order_id: activeOrderId,
            file_url: cloudinaryUrl,
            file_type: 'photo',
            source: 'telegram',
            uploaded_by: userId
          });

        if (dbError) {
          console.error('Database error:', dbError);
          throw new Error(`Database error: ${dbError.message}`);
        }

        await sendTelegramMessage(telegramBotToken, chatId, 
          '✅ Фотография успешно загружена и сохранена в системе!'
        );

        console.log(`Photo uploaded successfully for order ${activeOrderId}`);

      } catch (error) {
        console.error('Error processing photo:', error);
        await sendTelegramMessage(telegramBotToken, chatId, 
          '❌ Произошла ошибка при загрузке фотографии. Попробуйте еще раз.'
        );
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle other messages (only respond in private chats)
    if (message.text && chatType === 'private') {
      await sendTelegramMessage(telegramBotToken, chatId, 
        'Привет! Чтобы загрузить фотографии, сначала перейдите по ссылке из админки.\n\nВы получите ссылку в личном сообщении от администратора.'
      );
    } else if (message.text) {
      // Log messages from groups but don't respond
      console.log(`Ignoring text message from non-private chat: ${chatType} (Chat ID: ${chatId})`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in telegram-bot-webhook:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendTelegramMessage(token: string, chatId: number, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram API error: ${error}`);
  }

  return await response.json();
}

async function getTelegramFileUrl(token: string, fileId: string): Promise<string> {
  const response = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get file info: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }
  
  return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
}

async function downloadTelegramFile(fileUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(fileUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  
  return await response.arrayBuffer();
}

async function uploadToCloudinary(
  fileBuffer: ArrayBuffer, 
  orderId: string,
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  uploadPreset: string
): Promise<string> {
  const formData = new FormData();
  const file = new File([fileBuffer], `order_${orderId}_${Date.now()}.jpg`, { type: 'image/jpeg' });
  
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', `orders/${orderId}`);
  formData.append('resource_type', 'image');
  
  // Generate signature for secure upload
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = `folder=orders/${orderId}&timestamp=${timestamp}&upload_preset=${uploadPreset}`;
  const signature = await generateSignature(paramsToSign, apiSecret);
  
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);

  console.log('Uploading to Cloudinary with preset:', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Cloudinary upload error:', error);
    throw new Error(`Cloudinary upload failed: ${error}`);
  }

  const result = await response.json();
  console.log('Cloudinary upload successful:', result.secure_url);
  return result.secure_url;
}

async function generateSignature(params: string, apiSecret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(params));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}