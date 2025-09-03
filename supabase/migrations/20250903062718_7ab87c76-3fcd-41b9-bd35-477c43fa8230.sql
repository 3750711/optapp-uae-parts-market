-- Update all database functions to use api.partsbay.ae instead of vfiylfljiixqkjfqubyq.supabase.co
-- This updates the Edge Function URLs in existing database functions

-- Update product status change notification function
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Send notification only when status changes to:
  -- 1. active (published) - will send full listing with images
  -- 2. sold (sold) - will send sale notification
  -- DON'T send notifications when changing to pending (moderation)
  IF (TG_OP = 'UPDATE' AND 
      ((OLD.status != 'active' AND NEW.status = 'active') OR 
       (OLD.status != 'sold' AND NEW.status = 'sold'))) THEN
    
    -- If status changed to sold, send notification regardless, even without images
    -- For active status check if images exist
    IF (NEW.status = 'sold' OR 
        (NEW.status = 'active' AND EXISTS (
          SELECT 1 FROM product_images WHERE product_id = NEW.id LIMIT 1
        ))) THEN
      -- Update last notification timestamp
      NEW.last_notification_sent_at := NOW();
      
      -- Determine notification type
      DECLARE
        notification_type TEXT;
      BEGIN
        IF NEW.status = 'sold' THEN
          notification_type := 'sold';
        ELSIF NEW.status = 'active' THEN
          -- For active status send full listing, not status_change
          notification_type := 'product_published';
        ELSE
          notification_type := 'status_change';
        END IF;
        
        -- Call Edge Function to send notification
        PERFORM
          net.http_post(
            url:='https://api.partsbay.ae/functions/v1/send-telegram-notification',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
            body:=json_build_object('productId', NEW.id, 'notificationType', notification_type)::jsonb
          );
      END;
    ELSE
      -- If no images for active status, reset timestamp
      NEW.last_notification_sent_at := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update admin new user notification function
CREATE OR REPLACE FUNCTION public.notify_admins_new_pending_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Send only if profile is ready and haven't notified admins yet
  IF NEW.verification_status = 'pending'
     AND COALESCE(NEW.profile_completed, false) = true
     AND NEW.opt_id IS NOT NULL
     AND TRIM(COALESCE(NEW.full_name, '')) <> ''
     AND COALESCE(NEW.accepted_terms, false) = true
     AND COALESCE(NEW.accepted_privacy, false) = true
     AND NEW.admin_new_user_notified_at IS NULL
  THEN
    -- 1) Notify administrators
    BEGIN
      PERFORM
        net.http_post(
          url:='https://api.partsbay.ae/functions/v1/notify-admins-new-user',
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
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error invoking admin new user notification for user %: %', NEW.id, SQLERRM;
        -- Don't interrupt execution
    END;

    -- 2) Welcome message to user at the same time (with anti-duplication override)
    BEGIN
      PERFORM
        net.http_post(
          url:='https://api.partsbay.ae/functions/v1/send-welcome-message',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
          body:=jsonb_build_object(
            'userId', NEW.id,
            'userType', NEW.user_type,
            'forceOverride', true
          )
        );
      RAISE LOG 'Welcome message sent for user %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending welcome message for user %: %', NEW.id, SQLERRM;
        -- Don't interrupt execution
    END;

    -- 3) Update admin notification timestamp
    NEW.admin_new_user_notified_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;