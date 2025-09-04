-- Drop existing function first to avoid parameter name conflicts
DROP FUNCTION IF EXISTS public.admin_resend_welcome(uuid);

-- Update all database functions to use https://api.partsbay.ae instead of old supabase URL
-- This ensures all edge function calls use the custom domain

-- 1. Update notify_on_product_status_changes function
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only notify for status changes to 'active' if product has images, or to 'sold'
  IF ((NEW.status = 'active' AND OLD.status IS DISTINCT FROM NEW.status AND EXISTS(SELECT 1 FROM product_images WHERE product_id = NEW.id)) 
      OR (NEW.status = 'sold' AND OLD.status IS DISTINCT FROM NEW.status)) THEN
    
    -- Send notification via Edge Function with the correct domain
    BEGIN
      PERFORM
        net.http_post(
          url:='https://api.partsbay.ae/functions/v1/send-telegram-notification',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
          body:=jsonb_build_object(
            'type', 'product_status_change',
            'product_id', NEW.id,
            'title', NEW.title,
            'status', NEW.status,
            'seller_id', NEW.seller_id,
            'price', NEW.price,
            'lot_number', NEW.lot_number,
            'telegram_url', NEW.telegram_url,
            'product_url', NEW.product_url
          )
        );
      
      -- Update the last notification timestamp
      UPDATE public.products 
      SET last_notification_sent_at = now()
      WHERE id = NEW.id;
      
      RAISE LOG 'Product status notification sent for product %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending product status notification for product %: %', NEW.id, SQLERRM;
        -- Don't interrupt the main operation
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Update notify_admins_new_pending_user function 
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
            'fullName', COALESCE(NEW.full_name, 'Неизвестно'),
            'email', NEW.email,
            'userType', NEW.user_type,
            'phone', NEW.phone,
            'optId', NEW.opt_id,
            'telegram', NEW.telegram,
            'createdAt', NEW.created_at,
            'forceOverrideDuplicate', true
          )
        );
      RAISE LOG 'Welcome message sent to new user %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending welcome message to new user %: %', NEW.id, SQLERRM;
        -- Don't interrupt execution
    END;

    -- Update timestamp after successful operations
    NEW.admin_new_user_notified_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Recreate admin_resend_welcome function with correct parameters
CREATE OR REPLACE FUNCTION public.admin_resend_welcome(user_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record profiles%rowtype;
  result json;
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Access denied');
  END IF;

  -- Get user details
  SELECT * INTO user_record FROM profiles WHERE id = user_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;

  -- Send welcome message
  BEGIN
    PERFORM
      net.http_post(
        url:='https://api.partsbay.ae/functions/v1/send-welcome-message',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
        body:=jsonb_build_object(
          'userId', user_record.id,
          'fullName', COALESCE(user_record.full_name, 'Неизвестно'),
          'email', user_record.email,
          'userType', user_record.user_type,
          'phone', user_record.phone,
          'optId', user_record.opt_id,
          'telegram', user_record.telegram,
          'createdAt', user_record.created_at,
          'isResend', true,
          'forceOverrideDuplicate', true
        )
      );
    
    RAISE LOG 'Welcome message resent to user %', user_id_param;
    RETURN json_build_object('success', true, 'message', 'Welcome message sent successfully');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error resending welcome message to user %: %', user_id_param, SQLERRM;
      RETURN json_build_object('success', false, 'message', 'Error sending message: ' || SQLERRM);
  END;
END;
$$;