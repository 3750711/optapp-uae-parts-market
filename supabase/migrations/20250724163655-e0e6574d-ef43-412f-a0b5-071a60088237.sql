-- Fix event_logs constraint to include all existing action types plus sensitive_profile_change
-- Drop the existing constraint
ALTER TABLE public.event_logs DROP CONSTRAINT IF EXISTS event_logs_action_type_check;

-- Create new constraint with all existing action types plus the new one
ALTER TABLE public.event_logs ADD CONSTRAINT event_logs_action_type_check 
CHECK (action_type IN (
  'create',
  'update', 
  'delete',
  'login',
  'logout',
  'password_reset',
  'bulk_message_send',
  'email_change',
  'first_login_completed',
  'sensitive_profile_change'
));