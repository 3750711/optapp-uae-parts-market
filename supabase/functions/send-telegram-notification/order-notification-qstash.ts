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
    // Import QStash utilities
    const { getQStashConfig, publishToQueue, generateDeduplicationId } = await import('../_shared/qstash-config.ts');
    
    // Get QStash config from database
    const qstashConfig = await getQStashConfig();
    
    // Use order ID for deduplication
    const deduplicationId = generateDeduplicationId('order', orderData.id);
    
    // Publish to queue
    const result = await publishToQueue(
      qstashConfig,
      'order',
      {
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
      },
      deduplicationId
    );
    
    console.log('✅ [OrderQStash] Order notification queued:', result.messageId);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order notification queued via QStash',
        qstashMessageId: result.messageId
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
