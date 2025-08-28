-- Fix event_logs constraint to include auth action types
ALTER TABLE public.event_logs 
DROP CONSTRAINT IF EXISTS event_logs_action_type_check;

-- Add new constraint that includes auth-specific action types
ALTER TABLE public.event_logs 
ADD CONSTRAINT event_logs_action_type_check 
CHECK (action_type IN (
  'create', 'update', 'delete', 'view', 'login', 'logout',
  'registration_attempt', 'registration_success', 'registration_failure',
  'login_attempt', 'login_success', 'login_failure', 'rate_limit_hit'
));