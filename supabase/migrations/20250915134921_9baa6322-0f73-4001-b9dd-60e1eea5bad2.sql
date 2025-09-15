-- Create a cron job to clean up old security logs daily at 2 AM
SELECT cron.schedule(
  'cleanup-old-security-logs',
  '0 2 * * *', -- Daily at 2 AM
  $$
  SELECT public.cleanup_old_security_logs();
  $$
);