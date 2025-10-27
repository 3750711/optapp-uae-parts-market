// QStash-based order notification handler
// Routes order notifications through QStash queue system

import { logTelegramNotification } from '../shared/telegram-logger.ts';
import { REGISTERED_GROUP_CHAT_ID, ORDER_GROUP_CHAT_ID } from './config.ts';

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
    
    // Log successful queue to database
    await logTelegramNotification(supabaseClient, {
      function_name: 'order-notification-qstash',
      notification_type: notificationType === 'registered' ? 'order_registered' : 'order_created',
      recipient_type: 'group',
      recipient_identifier: notificationType === 'registered' 
        ? REGISTERED_GROUP_CHAT_ID 
        : ORDER_GROUP_CHAT_ID,
      message_text: `Order #${orderData.order_number} queued to QStash (${notificationType})`,
      status: 'pending',
      telegram_message_id: null,
      related_entity_type: 'order',
      related_entity_id: orderData.id,
      metadata: {
        qstash_message_id: result.messageId,
        order_number: orderData.order_number,
        notification_type: notificationType,
        deduplication_id: deduplicationId
      }
    });

    // Log to event_logs for debugging
    await supabaseClient.from('event_logs').insert({
      action_type: 'qstash_order_published',
      entity_type: 'order',
      entity_id: orderData.id,
      details: {
        notification_type: notificationType,
        qstash_message_id: result.messageId,
        order_number: orderData.order_number,
        target_group: notificationType === 'registered' ? REGISTERED_GROUP_CHAT_ID : ORDER_GROUP_CHAT_ID,
        timestamp: new Date().toISOString()
      }
    });

    console.log('📝 [OrderQStash] Logged to telegram_notifications_log and event_logs');
    
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
