-- Fix the event_logs constraint to include all existing action types plus the new one
ALTER TABLE public.event_logs 
DROP CONSTRAINT IF EXISTS event_logs_action_type_check;

ALTER TABLE public.event_logs 
ADD CONSTRAINT event_logs_action_type_check 
CHECK (action_type IN (
  'create', 
  'update', 
  'delete', 
  'bulk_message_send',
  'email_change',
  'first_login_completed',
  'sensitive_profile_change',
  'status_change_notification_scheduled'
));