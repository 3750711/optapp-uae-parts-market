-- Create cron job to send periodic admin notifications every minute
SELECT cron.schedule(
  'send-periodic-admin-notifications',
  '* * * * *', -- every minute
  $$
  SELECT
    net.http_post(
        url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-periodic-admin-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
        body:='{"trigger": "cron", "timestamp": "'|| now() ||'"}'::jsonb
    ) as request_id;
  $$
);