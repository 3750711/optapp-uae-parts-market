import { createServiceClient } from '../_shared/client.ts';

const NOVU_API_KEY = Deno.env.get('NOVU_API_KEY');
const NOVU_BACKEND_URL = 'https://api.novu.co/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, priceChanged, newPrice, oldPrice, transactionId, userId } = await req.json();

    console.log('🔔 [Novu Trigger] Received request:', { productId, transactionId });

    if (!NOVU_API_KEY) {
      console.error('❌ [Novu] NOVU_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'NOVU_API_KEY not configured' }),
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

    // Триггерим Novu workflow
    const novuResponse = await fetch(`${NOVU_BACKEND_URL}/events/trigger`, {
      method: 'POST',
      headers: {
        'Authorization': `ApiKey ${NOVU_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'product-repost', // Workflow ID в Novu
        to: {
          subscriberId: 'telegram-group' // ID нашей Telegram группы
        },
        payload: {
          productId,
          priceChanged,
          newPrice,
          oldPrice,
          lotNumber: product.lot_number,
          title: product.title,
          brand: product.brand,
          model: product.model,
          currentPrice: product.price
        },
        transactionId // Дедупликация!
      })
    });

    const novuResult = await novuResponse.json();

    if (!novuResponse.ok) {
      console.error('❌ [Novu] API error:', novuResult);
      return new Response(
        JSON.stringify({ error: 'Failed to trigger Novu workflow', details: novuResult }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('✅ [Novu] Workflow triggered:', novuResult);

    return new Response(
      JSON.stringify({ success: true, data: novuResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 [Novu Trigger] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
