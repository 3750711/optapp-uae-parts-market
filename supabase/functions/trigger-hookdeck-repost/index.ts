import { createServiceClient } from '../_shared/client.ts';

const HOOKDECK_SOURCE_URL = Deno.env.get('HOOKDECK_SOURCE_URL');

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

    console.log('📮 [Hookdeck] Received request:', { productId, idempotencyKey });

    if (!HOOKDECK_SOURCE_URL) {
      console.error('❌ [Hookdeck] HOOKDECK_SOURCE_URL not configured');
      return new Response(
        JSON.stringify({ error: 'HOOKDECK_SOURCE_URL not configured' }),
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
      console.error('❌ [Novu] Product not found:', productError);
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (product.seller_id !== userId) {
      console.error('❌ [Novu] Unauthorized access attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Отправляем событие в Hookdeck
    const hookdeckResponse = await fetch(HOOKDECK_SOURCE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'idempotency-key': idempotencyKey // Hookdeck автоматически дедуплицирует по этому ключу
      },
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
    });

    if (!hookdeckResponse.ok) {
      const errorText = await hookdeckResponse.text();
      console.error('❌ [Hookdeck] API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to queue repost in Hookdeck', details: errorText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const hookdeckResult = await hookdeckResponse.json();
    console.log('✅ [Hookdeck] Event queued:', hookdeckResult);

    return new Response(
      JSON.stringify({ success: true, data: hookdeckResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 [Hookdeck] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
