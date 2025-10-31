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

    // Fetch orders with seller info and shipments
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        seller:profiles!orders_seller_id_fkey(
          full_name,
          company_name,
          opt_id
        ),
        buyer:profiles!orders_buyer_id_fkey(
          full_name,
          company_name,
          opt_id
        ),
        order_shipments(
          id,
          place_number,
          container_number,
          shipment_status
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
    const items = [];
    let currentStickerNum = nextStickerNumber;

    orders.forEach((order) => {
      const senderName = order.seller?.company_name || order.seller?.full_name || 'PartsBay';
      
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
            sticker_header: `Стикер ${currentStickerNum}`,
            sender_code: order.sender_code || 'SIN',
            receiver_code: order.buyer?.opt_id || order.buyer_opt_id || '',
            order_number: String(order.order_number),
            qr_code: qrCode,
            product_line1: productLines[0] || 'Товар',
            product_line2: productLines[1] || `${order.quantity || 1}шт`,
            quantity_text: `Место: ${shipment.place_number}/${order.order_shipments.length}`,
            sender_text: `Отправитель: ${order.seller?.opt_id || order.seller_opt_id || 'N/A'}`,
            bottom_sticker: qrCode,
          });
          
          currentStickerNum++;
        });
      } else {
        // Если нет order_shipments, генерируем стикеры по order.place_number
        const totalPlaces = order.place_number || 1;
        for (let placeNum = 1; placeNum <= totalPlaces; placeNum++) {
          const qrCode = `${order.order_number}-${placeNum}-${order.created_at}`;
          
          items.push({
            sticker_header: `Стикер ${currentStickerNum}`,
            sender_code: order.sender_code || 'SIN',
            receiver_code: order.buyer?.opt_id || order.buyer_opt_id || '',
            order_number: String(order.order_number),
            qr_code: qrCode,
            product_line1: productLines[0] || 'Товар',
            product_line2: productLines[1] || `${order.quantity || 1}шт`,
            quantity_text: `Место: ${placeNum}/${totalPlaces}`,
            sender_text: `Отправитель: ${order.seller?.opt_id || order.seller_opt_id || 'N/A'}`,
            bottom_sticker: qrCode,
          });
          
          currentStickerNum++;
        }
      }
    });

    console.log('📦 [generate-stickers-batch] Generated', items.length, 'stickers for', orders.length, 'orders');
    console.log('📤 [generate-stickers-batch] Sample QR codes:', items.slice(0, 3).map(i => i.qr_code));

    // Log sample data structure for debugging
    console.log('📤 [generate-stickers-batch] Sample data structure:', JSON.stringify({
      company: {
        name: 'PartsBay',
        items: items.slice(0, 2)
      }
    }, null, 2));

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

    // Update orders and shipments in database
    let stickerIndex = 0;
    for (const order of orders) {
      // Обновляем основной заказ
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          sticker_number: nextStickerNumber + stickerIndex,
          sticker_generated_at: new Date().toISOString(),
          sticker_pdf_url: result.file,
        })
        .eq('id', order.id);

      if (orderError) {
        console.error('⚠️ [generate-stickers-batch] Failed to update order', order.id, orderError);
      }

      // Обновляем каждый shipment
      if (order.order_shipments && order.order_shipments.length > 0) {
        for (const shipment of order.order_shipments) {
          const { error: shipmentError } = await supabase
            .from('order_shipments')
            .update({
              sticker_generated_at: new Date().toISOString(),
              sticker_pdf_url: result.file,
            })
            .eq('id', shipment.id);

          if (shipmentError) {
            console.error('⚠️ [generate-stickers-batch] Failed to update shipment', shipment.id, shipmentError);
          }
          
          stickerIndex++;
        }
      } else {
        // Если нет shipments, считаем по place_number
        stickerIndex += order.place_number || 1;
      }
    }

    console.log('✅ [generate-stickers-batch] Database updated successfully');

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
