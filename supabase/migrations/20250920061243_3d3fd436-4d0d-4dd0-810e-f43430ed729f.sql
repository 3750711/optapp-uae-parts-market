-- Обновление CHECK constraint для добавления новых типов активности
ALTER TABLE public.event_logs DROP CONSTRAINT IF EXISTS event_logs_action_type_check;

ALTER TABLE public.event_logs ADD CONSTRAINT event_logs_action_type_check 
CHECK (action_type = ANY (ARRAY[
  -- Существующие типы
  'bulk_message_send'::text, 'create'::text, 'delete'::text, 
  'email_change'::text, 'first_login_completed'::text, 'login_failure'::text, 
  'login_success'::text, 'registration_success'::text, 'sensitive_profile_change'::text, 
  'status_change_notification_scheduled'::text, 'update'::text, 'login'::text, 
  'logout'::text, 'password_reset'::text, 'email_verification'::text, 
  'profile_update'::text, 'product_created'::text, 'product_updated'::text, 
  'product_deleted'::text, 'order_created'::text, 'order_updated'::text, 
  'order_cancelled'::text, 'compliance_violation'::text, 'compliance_monitoring'::text, 
  'url_cleanup_detected'::text,
  -- Новые типы для системы мониторинга активности
  'page_view'::text, 'client_error'::text, 'api_error'::text, 'button_click'::text
]));