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

// Store user sessions (in production, use database or Redis)
const userSessions = new Map<number, string>();

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

    if (!supabaseUrl || !supabaseServiceKey || !telegramBotToken) {
      throw new Error('Missing required environment variables');
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

    // Handle /start command with order_ID
    if (message.text?.startsWith('/start order_')) {
      const orderId = message.text.replace('/start order_', '');
      console.log(`User ${userId} linked to order ${orderId}`);
      
      // Store user session
      userSessions.set(userId, orderId);
      
      // Send confirmation message
      await sendTelegramMessage(telegramBotToken, chatId, 
        `✅ Привет! Теперь ты можешь отправлять фотографии для заказа #${orderId}.\n\nПросто отправь фотографии в этот чат, и они автоматически сохранятся в системе.`
      );
      
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle photos
    if (message.photo && message.photo.length > 0) {
      const activeOrderId = userSessions.get(userId);
      
      if (!activeOrderId) {
        await sendTelegramMessage(telegramBotToken, chatId, 
          '❌ Сначала нужно перейти по ссылке из админки для привязки к заказу.'
        );
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get the highest resolution photo
      const bestPhoto = message.photo.reduce((prev, current) => 
        (current.file_size || 0) > (prev.file_size || 0) ? current : prev
      );

      try {
        // Download photo from Telegram
        const fileUrl = await getTelegramFileUrl(telegramBotToken, bestPhoto.file_id);
        const photoBuffer = await downloadTelegramFile(fileUrl);

        // Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(
          photoBuffer, 
          activeOrderId, 
          cloudinaryCloudName!, 
          cloudinaryApiKey!, 
          cloudinaryApiSecret!
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

    // Handle other messages
    if (message.text) {
      await sendTelegramMessage(telegramBotToken, chatId, 
        'Привет! Чтобы загрузить фотографии, сначала перейдите по ссылке из админки.'
      );
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
  apiSecret: string
): Promise<string> {
  const formData = new FormData();
  const file = new File([fileBuffer], `order_${orderId}_${Date.now()}.jpg`, { type: 'image/jpeg' });
  
  formData.append('file', file);
  formData.append('upload_preset', 'ml_default');
  formData.append('folder', `orders/${orderId}`);
  formData.append('resource_type', 'image');
  
  // Generate signature for secure upload
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = `folder=orders/${orderId}&timestamp=${timestamp}&upload_preset=ml_default`;
  const signature = await generateSignature(paramsToSign, apiSecret);
  
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary upload failed: ${error}`);
  }

  const result = await response.json();
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