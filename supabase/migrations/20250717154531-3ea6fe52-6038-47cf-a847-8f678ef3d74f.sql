-- Add 'bulk_message_send' to the allowed action_type values in event_logs table
-- First, let's check the current constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.event_logs'::regclass 
AND contype = 'c';

-- Drop the existing check constraint
ALTER TABLE public.event_logs 
DROP CONSTRAINT IF EXISTS event_logs_action_type_check;

-- Add the new constraint with 'bulk_message_send' included
ALTER TABLE public.event_logs 
ADD CONSTRAINT event_logs_action_type_check 
CHECK (action_type IN ('create', 'update', 'delete', 'bulk_message_send'));