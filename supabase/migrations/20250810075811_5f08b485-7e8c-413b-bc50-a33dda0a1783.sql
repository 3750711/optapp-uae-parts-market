-- Create admin_resend_welcome RPC to allow admins to resend welcome Telegram message
CREATE OR REPLACE FUNCTION public.admin_resend_welcome(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  resp jsonb;
BEGIN
  -- Ensure only admins can call this
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Only admins can use this function';
  END IF;

  BEGIN
    -- Call the edge function to (re)send the welcome message with force flag
    SELECT net.http_post(
      url := 'https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/notify-user-welcome-registration',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
      body := jsonb_build_object('userId', p_user_id, 'force', true)
    )::jsonb INTO resp;
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
  END;

  RETURN json_build_object('success', true, 'response', resp);
END;
$$;
