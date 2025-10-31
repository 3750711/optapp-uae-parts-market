import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge Function для batch-генерации стикеров через CraftMyPDF
 * 
 * Вход:
 * {
 *   "orderIds": ["uuid1", "uuid2", ...],
 * }
 * 
 * Выход:
 * {
 *   "success": true,
 *   "pdf_url": "https://...",
 *   "total_stickers": 5,
 *   "sticker_numbers": [123, 124, 125, 126, 127]
 * }
 */

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🏷️ [generate-stickers-batch] Request received');

    // Parse request body
    const { orderIds } = await req.json();

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      throw new Error('orderIds must be a non-empty array');
    }

    console.log('📋 [generate-stickers-batch] Processing', orderIds.length, 'orders');

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://api.partsbay.ae';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not found');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch orders with seller info
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        seller:profiles!orders_seller_id_fkey(
          full_name,
          company_name,
          opt_id
        )
      `)
      .in('id', orderIds)
      .order('created_at', { ascending: true });

    if (ordersError) {
      console.error('❌ [generate-stickers-batch] Error fetching orders:', ordersError);
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    if (!orders || orders.length === 0) {
      throw new Error('No orders found for the provided IDs');
    }

    console.log('✅ [generate-stickers-batch] Fetched', orders.length, 'orders');

    // Get the last sticker number to continue numbering
    const { data: lastSticker } = await supabase
      .from('orders')
      .select('sticker_number')
      .not('sticker_number', 'is', null)
      .order('sticker_number', { ascending: false })
      .limit(1);

    const nextStickerNumber = (lastSticker?.[0]?.sticker_number || 0) + 1;

    console.log('🔢 [generate-stickers-batch] Next sticker number:', nextStickerNumber);

    // Prepare data for CraftMyPDF template
    const items = orders.map((order, index) => {
      const stickerNum = nextStickerNumber + index;
      
      // Construct product info
      const productLines = [];
      
      if (order.title) {
        productLines.push(order.title);
      }
      
      const carInfo = [order.brand, order.model, order.year]
        .filter(Boolean)
        .join(' ');
      
      if (carInfo) {
        productLines.push(`${order.quantity || 1}шт ${carInfo}`);
      }

      return {
        sticker_number: String(stickerNum),
        sender_code: order.sender_code || 'SIN',
        order_number: String(order.order_number || stickerNum),
        qr_url: `https://partsbay.ae/order/${order.order_number || order.id}`,
        product_info: productLines.join('\n'),
        quantity: String(order.quantity || 1),
        sender_name: order.seller?.company_name || order.seller?.full_name || 'PartsBay',
      };
    });

    console.log('📦 [generate-stickers-batch] Prepared', items.length, 'sticker items');

    // Get CraftMyPDF credentials
    const craftMyPdfApiKey = Deno.env.get('CRAFTMYPDF_API_KEY');
    const craftMyPdfTemplateId = Deno.env.get('CRAFTMYPDF_TEMPLATE_ID');

    if (!craftMyPdfApiKey || !craftMyPdfTemplateId) {
      throw new Error('CraftMyPDF credentials not configured in Supabase secrets');
    }

    // Call CraftMyPDF API
    console.log('📡 [generate-stickers-batch] Calling CraftMyPDF API...');

    const pdfResponse = await fetch('https://api.craftmypdf.com/v1/create', {
      method: 'POST',
      headers: {
        'X-API-KEY': craftMyPdfApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: craftMyPdfTemplateId,
        data: {
          items: items, // CraftMyPDF будет итерировать по этому массиву
        },
        export_type: 'json', // Return JSON with URL
        output_file: `stickers_batch_${Date.now()}.pdf`,
      }),
    });

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error('❌ [generate-stickers-batch] CraftMyPDF API error:', errorText);
      throw new Error(`CraftMyPDF API error: ${pdfResponse.status} - ${errorText}`);
    }

    const result = await pdfResponse.json();
    console.log('✅ [generate-stickers-batch] PDF generated:', result.file);

    // Update orders in database with sticker info
    const updates = orders.map((order, index) => ({
      id: order.id,
      sticker_number: nextStickerNumber + index,
      sticker_generated_at: new Date().toISOString(),
      sticker_pdf_url: result.file,
    }));

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          sticker_number: update.sticker_number,
          sticker_generated_at: update.sticker_generated_at,
          sticker_pdf_url: update.sticker_pdf_url,
        })
        .eq('id', update.id);

      if (updateError) {
        console.error('⚠️ [generate-stickers-batch] Failed to update order', update.id, updateError);
      }
    }

    console.log('✅ [generate-stickers-batch] Database updated successfully');

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        pdf_url: result.file,
        total_stickers: orders.length,
        sticker_numbers: items.map(i => parseInt(i.sticker_number)),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ [generate-stickers-batch] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
