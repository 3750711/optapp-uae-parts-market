// QStash-based order notification handler
// Routes order notifications through QStash queue system

export async function handleOrderNotificationQStash(
  orderData: any,
  supabaseClient: any,
  corsHeaders: Record<string, string>,
  notificationType: string = 'regular'
) {
  console.log('📮 [OrderQStash] Routing order notification through QStash, order #:', orderData.order_number, 'type:', notificationType);
  
  try {
    // Get QStash credentials from app_settings
    const { data: qstashSetting } = await supabaseClient
      .from('app_settings')
      .select('value')
      .eq('key', 'qstash_token')
      .maybeSingle();
    
    const QSTASH_TOKEN = qstashSetting?.value;
    
    if (!QSTASH_TOKEN) {
      console.error('❌ [OrderQStash] QSTASH_TOKEN not configured');
      throw new Error('QStash not configured');
    }
    
    // Get QStash endpoint name
    const { data: endpointSetting } = await supabaseClient
      .from('app_settings')
      .select('value')
      .eq('key', 'qstash_endpoint_name')
      .maybeSingle();
    
    const endpointName = endpointSetting?.value || 'telegram-notification-queue';
    const qstashUrl = `https://qstash.upstash.io/v2/publish/${endpointName}`;
    
    console.log(`📤 [OrderQStash] Publishing to: ${endpointName}`);
    
    // Prepare QStash payload
    const qstashPayload = {
      notificationType: 'order',
      payload: {
        orderId: orderData.id,
        notificationType: notificationType === 'registered' ? 'registered' : 'regular',
        orderNumber: orderData.order_number,
        status: orderData.status,
        deliveryMethod: orderData.delivery_method,
        title: orderData.title,
        brand: orderData.brand,
        model: orderData.model,
        price: orderData.price,
        deliveryPriceConfirm: orderData.delivery_price_confirm,
        placeNumber: orderData.place_number,
        textOrder: orderData.text_order,
        sellerOptId: orderData.seller_opt_id,
        buyerOptId: orderData.buyer_opt_id,
        sellerId: orderData.seller_id,
        images: orderData.images || []
      }
    };
    
    // Publish to QStash
    const qstashResponse = await fetch(qstashUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QSTASH_TOKEN}`,
        'Content-Type': 'application/json',
        'Upstash-Retries': '3',
        'Upstash-Deduplication-Id': `order-${orderData.id}-${notificationType}-${Math.floor(Date.now() / 1000)}`,
        'Upstash-Forward-Queue': 'telegram-notification-queue'
      },
      body: JSON.stringify(qstashPayload)
    });
    
    if (!qstashResponse.ok) {
      const errorText = await qstashResponse.text();
      console.error('❌ [OrderQStash] Failed to publish:', errorText);
      throw new Error(`QStash publish failed: ${errorText}`);
    }
    
    const qstashResult = await qstashResponse.json();
    console.log('✅ [OrderQStash] Order notification queued:', qstashResult.messageId);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order notification queued via QStash',
        qstashMessageId: qstashResult.messageId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('💥 [OrderQStash] Error:', error);
    
    // Log failed attempt
    await supabaseClient.from('event_logs').insert({
      action_type: 'notification_failed',
      entity_type: 'order',
      entity_id: orderData.id,
      details: {
        error: 'QStash routing failed',
        error_message: error?.message || 'Unknown error',
        notification_type: notificationType,
        timestamp: new Date().toISOString()
      }
    });
    
    throw error;
  }
}
