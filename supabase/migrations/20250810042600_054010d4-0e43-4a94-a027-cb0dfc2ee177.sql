-- Update trigger function to avoid race condition: remove flag update and let Edge Function set it after success
CREATE OR REPLACE FUNCTION public.notify_admins_new_pending_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Send only if profile is truly ready and we haven't notified yet
  IF NEW.verification_status = 'pending'
     AND COALESCE(NEW.profile_completed, false) = true
     AND NEW.opt_id IS NOT NULL
     AND TRIM(COALESCE(NEW.full_name, '')) <> ''
     AND COALESCE(NEW.accepted_terms, false) = true
     AND COALESCE(NEW.accepted_privacy, false) = true
     AND NEW.admin_new_user_notified_at IS NULL
  THEN
    -- Call Edge Function (same as before) WITHOUT setting the flag here
    PERFORM
      net.http_post(
        url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/notify-admins-new-user',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
        body:=jsonb_build_object(
          'userId', NEW.id,
          'fullName', COALESCE(NEW.full_name, 'Неизвестно'),
          'email', NEW.email,
          'userType', NEW.user_type,
          'phone', NEW.phone,
          'optId', NEW.opt_id,
          'telegram', NEW.telegram,
          'createdAt', NEW.created_at
        )
      );

    RAISE LOG 'Admin new user notification invoked for user %', NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in admin new user notification trigger: %', SQLERRM;
    RETURN NEW; -- Do not fail the transaction on notification error
END;
$function$;