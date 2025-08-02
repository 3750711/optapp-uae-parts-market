interface TelegramLogData {
  function_name: string;
  notification_type: string;
  recipient_type: 'personal' | 'group';
  recipient_identifier: string;
  recipient_name?: string;
  message_text: string;
  status: 'sent' | 'failed' | 'pending';
  telegram_message_id?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  error_details?: any;
  metadata?: any;
}

export async function logTelegramNotification(
  supabaseClient: any,
  data: TelegramLogData
): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('telegram_notifications_log')
      .insert({
        function_name: data.function_name,
        notification_type: data.notification_type,
        recipient_type: data.recipient_type,
        recipient_identifier: data.recipient_identifier,
        recipient_name: data.recipient_name,
        message_text: data.message_text,
        status: data.status,
        telegram_message_id: data.telegram_message_id,
        related_entity_type: data.related_entity_type,
        related_entity_id: data.related_entity_id,
        error_details: data.error_details,
        metadata: data.metadata
      });

    if (error) {
      console.error('❌ Failed to log telegram notification:', error);
    } else {
      console.log('✅ Telegram notification logged successfully');
    }
  } catch (error) {
    console.error('💥 Exception while logging telegram notification:', error);
  }
}