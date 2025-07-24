-- Fix event_logs constraint to allow sensitive_profile_change action type
-- Drop the existing constraint
ALTER TABLE public.event_logs DROP CONSTRAINT IF EXISTS event_logs_action_type_check;

-- Create new constraint with the additional action type
ALTER TABLE public.event_logs ADD CONSTRAINT event_logs_action_type_check 
CHECK (action_type IN (
  'create',
  'update', 
  'delete',
  'login',
  'logout',
  'password_reset',
  'sensitive_profile_change'
));