-- Add missing action_types for QStash notification logging
-- These action_types are used by:
-- - telegram-queue-handler/index.ts (line 1397): 'qstash_webhook_received'
-- - order-notification-qstash.ts (line 75): 'qstash_order_published'

ALTER TABLE public.event_logs 
DROP CONSTRAINT IF EXISTS event_logs_action_type_check;

ALTER TABLE public.event_logs 
ADD CONSTRAINT event_logs_action_type_check 
CHECK (action_type = ANY (ARRAY[
  'bulk_message_send', 'create', 'delete', 'email_change', 
  'first_login_completed', 'login_failure', 'login_success', 
  'registration_success', 'sensitive_profile_change', 
  'status_change_notification_scheduled', 'update', 'login', 
  'logout', 'password_reset', 'email_verification', 'profile_update', 
  'product_created', 'product_updated', 'product_deleted', 
  'order_created', 'order_updated', 'order_cancelled', 
  'compliance_violation', 'compliance_monitoring', 'url_cleanup_detected', 
  'page_view', 'client_error', 'api_error', 'button_click',
  'telegram_queue_handler_invoked',
  'qstash_signature_failed',
  'qstash_webhook_received',
  'qstash_order_published'
]::text[]));