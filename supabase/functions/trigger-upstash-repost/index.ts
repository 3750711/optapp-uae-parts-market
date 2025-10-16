import { createServiceClient } from '../_shared/client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, priceChanged, newPrice, oldPrice, idempotencyKey, userId } = await req.json();

    console.log('📮 [QStash] Received request:', { productId, idempotencyKey });

    const QSTASH_TOKEN = Deno.env.get('QSTASH_TOKEN');
    if (!QSTASH_TOKEN) {
      console.error('❌ [QStash] QSTASH_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'QSTASH_TOKEN not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Создаем Supabase client для проверки прав
    const supabaseClient = createServiceClient();

    // Проверяем что товар принадлежит пользователю и получаем данные о cooldown
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('seller_id, title, lot_number, price, brand, model, last_notification_sent_at')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('❌ [QStash] Product not found:', productError);
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (product.seller_id !== userId) {
      console.error('❌ [QStash] Unauthorized access attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Проверяем cooldown для не-админов
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('user_type')
      .eq('id', userId)
      .single();

    const isAdmin = profile?.user_type === 'admin';

    if (!isAdmin && product.last_notification_sent_at) {
      const hoursSince = (Date.now() - new Date(product.last_notification_sent_at).getTime()) / 3600000;
      if (hoursSince < 72) {
        const hoursRemaining = Math.ceil(72 - hoursSince);
        console.warn(`⏱️ [QStash] Cooldown active for product ${productId}: ${hoursRemaining} hours remaining`);
        return new Response(
          JSON.stringify({ 
            error: 'Cooldown active',
            hours_remaining: hoursRemaining,
            message: `You can repost in ${hoursRemaining} hours`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
    }

    // Отправляем событие в QStash Queue для последовательной обработки
    console.log('📤 [QStash] Enqueueing to telegram-repost-queue');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://api.partsbay.ae';
    const destinationUrl = `${supabaseUrl}/functions/v1/upstash-repost-handler`;
    const qstashUrl = 'https://qstash.upstash.io/v2/enqueue/telegram-repost-queue';
    
    console.log(`📤 [QStash] Queuing to: ${qstashUrl}`);
    console.log(`📤 [QStash] Destination: ${destinationUrl}`);
    
    const qstashResponse = await fetch(qstashUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QSTASH_TOKEN}`,
        'Content-Type': 'application/json',
        'Upstash-Retries': '3',
        'Upstash-Deduplication-Id': idempotencyKey
      },
      body: JSON.stringify({
        url: destinationUrl,
        body: JSON.stringify({
          productId,
          notificationType: 'repost',
          priceChanged,
          newPrice,
          oldPrice,
          lotNumber: product.lot_number,
          title: product.title,
          brand: product.brand,
          model: product.model,
          currentPrice: product.price
        })
      })
    });

    if (!qstashResponse.ok) {
      const errorText = await qstashResponse.text();
      console.error('❌ [QStash] Failed to publish:', errorText);
      throw new Error(`QStash API error (${qstashResponse.status}): ${errorText}`);
    }

    const result = await qstashResponse.json();
    
    // Log QStash metrics for monitoring
    console.log('✅ [QStash] Event queued successfully:', {
      messageId: result.messageId,
      queueLength: result.queueLength,
      estimatedDelay: result.estimatedDelay,
      productId,
      lotNumber: product.lot_number
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        metrics: {
          messageId: result.messageId,
          queueLength: result.queueLength,
          estimatedDelay: result.estimatedDelay
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 [QStash] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
