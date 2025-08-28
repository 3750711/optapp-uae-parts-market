-- Fix event_logs constraint to include all existing and new auth action types
ALTER TABLE public.event_logs 
DROP CONSTRAINT IF EXISTS event_logs_action_type_check;

-- Add comprehensive constraint that includes all existing and new action types
ALTER TABLE public.event_logs 
ADD CONSTRAINT event_logs_action_type_check 
CHECK (action_type IN (
  -- Existing types
  'create', 'update', 'delete', 'bulk_message_send', 'email_change', 
  'first_login_completed', 'sensitive_profile_change', 'status_change_notification_scheduled',
  -- New auth types
  'registration_attempt', 'registration_success', 'registration_failure',
  'login_attempt', 'login_success', 'login_failure', 'rate_limit_hit'
));