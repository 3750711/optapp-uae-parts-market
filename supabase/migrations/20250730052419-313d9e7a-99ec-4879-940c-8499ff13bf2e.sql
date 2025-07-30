-- Fix the event_logs constraint to include the new action type
ALTER TABLE public.event_logs 
DROP CONSTRAINT IF EXISTS event_logs_action_type_check;

ALTER TABLE public.event_logs 
ADD CONSTRAINT event_logs_action_type_check 
CHECK (action_type IN (
  'create', 
  'update', 
  'delete', 
  'login', 
  'logout', 
  'password_reset',
  'status_change_notification_scheduled'
));