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
    from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    sender_chat?: {
      id: number;
      title?: string;
      type: string;
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
    forward_from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    forward_from_chat?: {
      id: number;
      title?: string;
      type: string;
    };
    forward_from_message_id?: number;
    forward_date?: number;
  };
  channel_post?: {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    sender_chat?: {
      id: number;
      title?: string;
      type: string;
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
    forward_from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    forward_from_chat?: {
      id: number;
      title?: string;
      type: string;
    };
    forward_from_message_id?: number;
    forward_date?: number;
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

    // Группы для мониторинга
    const MONITORING_CHAT_ID = '-1679816540';  // OPT UAE MARKET - принимаем ВСЕ сообщения
    const PRODUCT_GROUP_CHAT_ID = Deno.env.get('TELEGRAM_GROUP_CHAT_ID') || '-1002804153717';  // Запасная группа
    const BOT_ID = parseInt(Deno.env.get('TELEGRAM_BOT_ID') || '0');

    // Нормализуем chat_id для сравнения
    const currentChatId = message.chat.id.toString();
    const isMonitoringGroup = currentChatId === MONITORING_CHAT_ID || 
                              currentChatId === '-100' + MONITORING_CHAT_ID.replace('-', '') ||
                              currentChatId.replace('-', '') === MONITORING_CHAT_ID.replace('-', '');
    const isProductGroup = currentChatId === PRODUCT_GROUP_CHAT_ID ||
                           currentChatId === '-100' + PRODUCT_GROUP_CHAT_ID.replace('-', '') ||
                           currentChatId.replace('-', '').replace('100', '') === PRODUCT_GROUP_CHAT_ID.replace('-', '').replace('100', '');

    let messageSource = 'unknown';
    
    if (isMonitoringGroup) {
      // ✅ Принимаем ВСЕ сообщения из OPT UAE MARKET
      console.log('✅ Message from OPT UAE MARKET monitoring group');
      
      // Определяем источник для логирования
      if (message.from?.is_bot && message.from.id === BOT_ID) {
        messageSource = 'direct_bot';
      } else if (message.sender_chat?.id) {
        messageSource = 'sender_chat_anonymous';
      } else if (message.forward_from?.id === BOT_ID) {
        messageSource = 'forwarded_from_bot';
      } else if (message.from?.id) {
        messageSource = 'user_' + message.from.id;
      }
      
      console.log(`📍 Message source: ${messageSource}, from: ${message.from?.id || 'N/A'}, sender_chat: ${message.sender_chat?.id || 'N/A'}`);
      
    } else if (isProductGroup) {
      // Запасной вариант для старой группы (только от бота)
      console.log('✅ Message from Product Group (legacy)');
      
      if (!message.from?.is_bot || message.from.id !== BOT_ID) {
        console.log(`⏭️ Skip: legacy group requires bot messages only (from: ${message.from?.id}, is_bot: ${message.from?.is_bot})`);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      messageSource = 'direct_bot_legacy';
      
    } else {
      console.log(`⏭️ Skip: chat ${message.chat.id} is not a monitored group`);
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

    // Определяем правильный message_id (для пересланных сообщений используем оригинальный ID)
    const originalMessageId = message.forward_from_message_id || message.message_id;
    console.log(`📨 Using message_id: ${originalMessageId} (forwarded: ${!!message.forward_from_message_id})`);

    // Обновляем статус
    const { error: updateError } = await supabase
      .from('products')
      .update({
        telegram_notification_status: 'sent',
        telegram_message_id: originalMessageId,
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
      recipient_identifier: isMonitoringGroup ? MONITORING_CHAT_ID : PRODUCT_GROUP_CHAT_ID,
      recipient_name: isMonitoringGroup ? 'OPT UAE MARKET' : 'Product Group',
      message_text: messageText.substring(0, 500),
      status: 'sent',
      telegram_message_id: originalMessageId.toString(),
      related_entity_type: 'product',
      related_entity_id: product.id,
      metadata: {
        lot_number: lotNumber,
        confirmed_by_webhook: true,
        monitoring_group: isMonitoringGroup,
        message_source: messageSource,
        chat_id: message.chat.id,
        from_user_id: message.from?.id,
        sender_chat_id: message.sender_chat?.id,
        is_forwarded: !!message.forward_from_message_id,
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
