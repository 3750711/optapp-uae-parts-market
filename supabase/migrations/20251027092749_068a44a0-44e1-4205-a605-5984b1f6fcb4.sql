-- Расширяем event_logs.action_type для поддержки QStash логирования
-- Миграция: добавляем 'telegram_queue_handler_invoked' и 'qstash_signature_failed'

-- Удаляем старый constraint
ALTER TABLE public.event_logs 
DROP CONSTRAINT IF EXISTS event_logs_action_type_check;

-- Создаем новый constraint с расширенным списком
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
  'telegram_queue_handler_invoked',  -- NEW: для логирования входящих QStash запросов
  'qstash_signature_failed'          -- NEW: для логирования ошибок проверки подписи
]::text[]));