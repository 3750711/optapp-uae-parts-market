-- Add 'bulk_message_send' to the allowed action_type values in event_logs table
-- Drop the existing check constraint
ALTER TABLE public.event_logs 
DROP CONSTRAINT IF EXISTS event_logs_action_type_check;

-- Add the new constraint with 'bulk_message_send' included alongside all existing values
ALTER TABLE public.event_logs 
ADD CONSTRAINT event_logs_action_type_check 
CHECK (action_type IN ('create', 'update', 'delete', 'first_login_completed', 'email_change', 'password_change', 'status_change', 'login', 'logout', 'bulk_message_send'));