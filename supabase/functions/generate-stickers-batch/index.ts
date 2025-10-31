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

    // Fetch orders without JOIN (используем напрямую seller_opt_id и buyer_opt_id)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        title,
        brand,
        model,
        year,
        quantity,
        created_at,
        sender_code,
        seller_opt_id,
        buyer_opt_id,
        place_number,
        order_shipments(
          id,
          place_number,
          container_number
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

    // Prepare data for CraftMyPDF template
    const items = [];

    orders.forEach((order) => {
      
      // Construct product info
      const productLines = [];
      if (order.title) {
        productLines.push(order.title);
      }
      const carInfo = [order.brand, order.model, order.year].filter(Boolean).join(' ');
      if (carInfo) {
        productLines.push(`${order.quantity || 1}шт ${carInfo}`);
      }

      // Генерируем стикер для каждого места из order_shipments
      if (order.order_shipments && order.order_shipments.length > 0) {
        order.order_shipments.forEach((shipment) => {
          const qrCode = `${order.order_number}-${shipment.place_number}-${order.created_at}`;
          
          items.push({
            sender_code: order.sender_code || 'SIN',
            receiver_code: order.buyer_opt_id || '',
            order_number: String(order.order_number),
            qr_code: qrCode,
            product_line1: productLines[0] || 'Товар',
            product_line2: productLines[1] || `${order.quantity || 1}шт`,
            quantity_text: `Место: ${shipment.place_number}/${order.order_shipments.length}`,
            sender_text: `Отправитель: ${order.seller_opt_id || 'N/A'}`,
          });
        });
      } else {
        // Если нет order_shipments, генерируем стикеры по order.place_number
        const totalPlaces = order.place_number || 1;
        for (let placeNum = 1; placeNum <= totalPlaces; placeNum++) {
          const qrCode = `${order.order_number}-${placeNum}-${order.created_at}`;
          
          items.push({
            sender_code: order.sender_code || 'SIN',
            receiver_code: order.buyer_opt_id || '',
            order_number: String(order.order_number),
            qr_code: qrCode,
            product_line1: productLines[0] || 'Товар',
            product_line2: productLines[1] || `${order.quantity || 1}шт`,
            quantity_text: `Место: ${placeNum}/${totalPlaces}`,
            sender_text: `Отправитель: ${order.seller_opt_id || 'N/A'}`,
          });
        }
      }
    });

    console.log(`📦 [generate-stickers-batch] Generated ${items.length} stickers for ${orders.length} orders`);

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
          company: {
            name: 'PartsBay',
            items: items,
          }
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

    // Batch-обновление через одну SQL-функцию
    const { data: batchResult, error: batchError } = await supabase.rpc('batch_update_stickers', {
      order_ids: orderIds,
      sticker_pdf: result.file
    });

    if (batchError) {
      console.error('⚠️ [generate-stickers-batch] Batch update failed:', batchError);
      throw new Error('Failed to update database');
    }

    console.log('✅ [generate-stickers-batch] Database updated in single transaction');

    const nextStickerNumber = batchResult.next_sticker_number;
    const totalStickers = batchResult.total_stickers;

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        pdf_url: result.file,
        total_orders: orders.length,
        total_stickers: items.length,
        sticker_numbers: Array.from({ length: items.length }, (_, i) => nextStickerNumber + i),
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
