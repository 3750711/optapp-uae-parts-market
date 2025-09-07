-- Expand event_logs action_type constraint to include monitoring actions
ALTER TABLE public.event_logs 
DROP CONSTRAINT IF EXISTS event_logs_action_type_check;

-- Add expanded constraint with new action types for URL monitoring
ALTER TABLE public.event_logs 
ADD CONSTRAINT event_logs_action_type_check 
CHECK (action_type IN (
  'create', 'update', 'delete', 'login', 'logout', 
  'password_reset', 'email_verification', 'profile_update',
  'product_created', 'product_updated', 'product_deleted',
  'order_created', 'order_updated', 'order_cancelled',
  'compliance_violation', 'compliance_monitoring', 'url_cleanup_detected'
));