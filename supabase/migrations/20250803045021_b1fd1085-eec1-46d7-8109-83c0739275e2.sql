-- Create function to notify user about verification status changes
CREATE OR REPLACE FUNCTION notify_user_verification_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify when verification_status changes
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    -- Call the edge function to send user notification
    PERFORM
      net.http_post(
        url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/notify-user-verification-status',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
        body:=jsonb_build_object(
          'userId', NEW.id,
          'status', NEW.verification_status,
          'userType', NEW.user_type,
          'fullName', COALESCE(NEW.full_name, 'Пользователь'),
          'telegramId', NEW.telegram_id
        )
      );
      
    RAISE LOG 'User verification status notification sent for user %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in user verification status notification trigger: %', SQLERRM;
    RETURN NEW; -- Don't fail the transaction
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user verification status changes
DROP TRIGGER IF EXISTS trigger_notify_user_verification_status_change ON profiles;
CREATE TRIGGER trigger_notify_user_verification_status_change
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_verification_status_change();

-- Create function to notify admins about new pending users
CREATE OR REPLACE FUNCTION notify_admins_new_pending_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify for new users with pending status
  IF NEW.verification_status = 'pending' THEN
    -- Call the edge function to send admin notifications
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
      
    RAISE LOG 'Admin new user notification sent for user %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in admin new user notification trigger: %', SQLERRM;
    RETURN NEW; -- Don't fail the transaction
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new pending users
DROP TRIGGER IF EXISTS trigger_notify_admins_new_pending_user ON profiles;
CREATE TRIGGER trigger_notify_admins_new_pending_user
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_pending_user();