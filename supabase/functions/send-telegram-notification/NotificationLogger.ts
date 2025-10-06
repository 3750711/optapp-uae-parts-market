interface LogData {
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

export class NotificationLogger {
  constructor(private supabaseClient: any) {}

  async log(data: LogData): Promise<void> {
    try {
      const { error } = await this.supabaseClient
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
        console.error('❌ Failed to log notification:', error);
      }
    } catch (error) {
      console.error('💥 Exception while logging notification:', error);
    }
  }
}
