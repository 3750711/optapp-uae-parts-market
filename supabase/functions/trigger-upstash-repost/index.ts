import { Client } from "npm:@upstash/qstash@2";
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

    // Проверяем что товар принадлежит пользователю
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('seller_id, title, lot_number, price, brand, model')
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

    // Инициализируем QStash клиент
    const qstash = new Client({ token: QSTASH_TOKEN });

    // Отправляем событие в QStash очередь
    const result = await qstash.publishJSON({
      url: "https://api.partsbay.ae/functions/v1/upstash-repost-handler",
      body: {
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
      },
      retries: 3,
      delay: 0,
      deduplicationId: idempotencyKey,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ [QStash] Event queued:', result);

    return new Response(
      JSON.stringify({ success: true, data: result }),
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
