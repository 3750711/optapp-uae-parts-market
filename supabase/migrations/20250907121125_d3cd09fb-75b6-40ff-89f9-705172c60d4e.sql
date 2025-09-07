-- Expand event_logs action_type constraint to include all existing and new monitoring actions
ALTER TABLE public.event_logs 
DROP CONSTRAINT IF EXISTS event_logs_action_type_check;

-- Add expanded constraint with all existing action types plus new monitoring types
ALTER TABLE public.event_logs 
ADD CONSTRAINT event_logs_action_type_check 
CHECK (action_type IN (
  -- Existing action types from the database
  'bulk_message_send', 'create', 'delete', 'email_change', 
  'first_login_completed', 'login_failure', 'login_success', 
  'registration_success', 'sensitive_profile_change', 
  'status_change_notification_scheduled', 'update',
  -- Additional common action types
  'login', 'logout', 'password_reset', 'email_verification', 
  'profile_update', 'product_created', 'product_updated', 
  'product_deleted', 'order_created', 'order_updated', 'order_cancelled',
  -- New URL monitoring action types
  'compliance_violation', 'compliance_monitoring', 'url_cleanup_detected'
));