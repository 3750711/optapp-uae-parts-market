-- Setup automatic session computation schedule
-- This migration creates a scheduled job to compute user sessions every hour

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Clear existing cron job if it exists
SELECT cron.unschedule('compute-user-sessions-hourly') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'compute-user-sessions-hourly'
);

-- Schedule user sessions computation every hour
SELECT cron.schedule(
  'compute-user-sessions-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
      url := public.functions_url('/functions/v1/compute-user-sessions'),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{"automated": true}'::jsonb
    ) as request_id;
  $$
);

-- Log the schedule setup
INSERT INTO public.event_logs (
  action_type, 
  entity_type, 
  details
) VALUES (
  'system_setup', 
  'cron_job', 
  jsonb_build_object(
    'job_name', 'compute-user-sessions-hourly',
    'schedule', '0 * * * *',
    'description', 'Automated user sessions computation every hour',
    'created_at', now()
  )
);