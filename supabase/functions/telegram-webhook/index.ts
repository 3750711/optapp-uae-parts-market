import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      title?: string;
      type: string;
    };
    date: number;
    text?: string;
    caption?: string;
    photo?: Array<any>;
    media_group_id?: string;
  };
  channel_post?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      title?: string;
      type: string;
    };
    date: number;
    text?: string;
    caption?: string;
    photo?: Array<any>;
    media_group_id?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();
    console.log('📨 Webhook received:', JSON.stringify(update, null, 2));

    const message = update.message || update.channel_post;
    
    if (!message) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Проверяем что это наша группа продуктов
    const PRODUCT_GROUP_CHAT_ID = Deno.env.get('TELEGRAM_GROUP_CHAT_ID') || '-1002804153717';
    const chatIdStr = message.chat.id.toString().replace('-', '');
    const targetChatIdStr = PRODUCT_GROUP_CHAT_ID.replace('-', '').replace('100', '');
    
    if (chatIdStr !== targetChatIdStr && chatIdStr !== PRODUCT_GROUP_CHAT_ID.replace('-', '')) {
      console.log(`⏭️ Skip: chat ${message.chat.id} != ${PRODUCT_GROUP_CHAT_ID}`);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Проверяем что сообщение от нашего бота
    const BOT_ID = parseInt(Deno.env.get('TELEGRAM_BOT_ID') || '0');
    if (!message.from?.is_bot || message.from.id !== BOT_ID) {
      console.log(`⏭️ Skip: from ${message.from?.id} (is_bot: ${message.from?.is_bot}) != bot ${BOT_ID}`);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Извлекаем текст
    const messageText = message.text || message.caption || '';
    
    // Парсим LOT номер
    const lotMatch = messageText.match(/LOT\(лот\)\s*#(\d+)/i) || 
                     messageText.match(/Лот\s*#(\d+)/i);
    
    if (!lotMatch) {
      console.log('⏭️ Skip: no LOT number found in message text');
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const lotNumber = parseInt(lotMatch[1]);
    console.log(`✅ Found LOT #${lotNumber}, message_id: ${message.message_id}`);

    // Подключаемся к Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Находим товар
    const { data: product, error: findError } = await supabase
      .from('products')
      .select('id, lot_number, title, telegram_notification_status')
      .eq('lot_number', lotNumber)
      .single();

    if (findError || !product) {
      console.error(`❌ Product LOT #${lotNumber} not found:`, findError);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📦 Product found: ${product.id} (${product.title}), current status: ${product.telegram_notification_status}`);

    // Обновляем статус
    const { error: updateError } = await supabase
      .from('products')
      .update({
        telegram_notification_status: 'sent',
        telegram_message_id: message.message_id,
        telegram_confirmed_at: new Date().toISOString(),
        last_notification_sent_at: new Date(message.date * 1000).toISOString(),
        telegram_last_error: null
      })
      .eq('id', product.id);

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      return new Response(JSON.stringify({ ok: false, error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ Product ${product.id} confirmed as sent`);

    // Логируем подтверждение
    await supabase.from('telegram_notifications_log').insert({
      function_name: 'telegram-webhook-confirmation',
      notification_type: 'product_published_confirmed',
      recipient_type: 'group',
      recipient_identifier: PRODUCT_GROUP_CHAT_ID,
      recipient_name: 'Product Group',
      message_text: messageText.substring(0, 500),
      status: 'sent',
      telegram_message_id: message.message_id.toString(),
      related_entity_type: 'product',
      related_entity_id: product.id,
      metadata: {
        lot_number: lotNumber,
        confirmed_by_webhook: true,
        message_date: new Date(message.date * 1000).toISOString()
      }
    });

    return new Response(JSON.stringify({ 
      ok: true, 
      product_id: product.id,
      lot_number: lotNumber,
      status: 'confirmed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
