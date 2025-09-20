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