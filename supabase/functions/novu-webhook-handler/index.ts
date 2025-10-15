import { createServiceClient } from '../_shared/client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, novu-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    console.log('🔔 [Novu Webhook] Received event:', JSON.stringify(payload, null, 2));

    // Novu отправляет данные в разных форматах в зависимости от типа события
    // Для webhook step данные будут в payload
    const eventPayload = payload.payload || payload;
    
    const { productId, priceChanged, newPrice, oldPrice } = eventPayload;

    if (!productId) {
      console.error('❌ [Novu Webhook] Missing productId in payload');
      return new Response(
        JSON.stringify({ error: 'Missing productId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('📤 [Novu Webhook] Sending to Telegram:', {
      productId,
      priceChanged,
      newPrice,
      oldPrice
    });

    // Создаем Supabase client
    const supabaseClient = createServiceClient();

    // Вызываем существующую логику отправки в Telegram
    const { data, error } = await supabaseClient.functions.invoke('send-telegram-notification', {
      body: {
        productId,
        notificationType: 'repost',
        priceChanged: priceChanged || false,
        newPrice,
        oldPrice
      }
    });

    if (error) {
      console.error('❌ [Novu Webhook] Failed to send Telegram notification:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to send notification', details: error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('✅ [Novu Webhook] Telegram notification sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 [Novu Webhook] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
