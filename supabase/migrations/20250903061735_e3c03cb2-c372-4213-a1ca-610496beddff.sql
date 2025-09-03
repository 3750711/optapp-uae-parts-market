-- Update all database functions to use api.partsbay.ae instead of vfiylfljiixqkjfqubyq.supabase.co

-- Update notify_admins_new_pending_user function
CREATE OR REPLACE FUNCTION public.notify_admins_new_pending_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Отправляем только если профиль готов и ещё не уведомляли админов
  IF NEW.verification_status = 'pending'
     AND COALESCE(NEW.profile_completed, false) = true
     AND NEW.opt_id IS NOT NULL
     AND TRIM(COALESCE(NEW.full_name, '')) <> ''
     AND COALESCE(NEW.accepted_terms, false) = true
     AND COALESCE(NEW.accepted_privacy, false) = true
     AND NEW.admin_new_user_notified_at IS NULL
  THEN
    -- 1) Уведомление администраторов
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
        -- Не прерываем выполнение
    END;

    -- 2) Приветственное сообщение пользователю в тот же момент (с переопределением антидублирования)
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
        -- Не прерываем выполнение
    END;

    -- 3) Обновляем отметку об уведомлении админов
    NEW.admin_new_user_notified_at = NOW();
  END IF;

  RETURN NEW;
END;
$function$;

-- Update notify_on_product_status_changes function
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Only notify on status change to 'active' (and product has images) or 'sold'
  -- Skip 'pending' status to avoid spam
  IF (NEW.status = 'active' AND NEW.status IS DISTINCT FROM OLD.status) OR
     (NEW.status = 'sold' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    
    -- Only send notification for 'active' if product has images
    IF NEW.status = 'active' THEN
      -- Check if product has at least one image
      IF NOT EXISTS (
        SELECT 1 FROM public.product_images 
        WHERE product_id = NEW.id 
        LIMIT 1
      ) THEN
        -- No images, skip notification
        RETURN NEW;
      END IF;
    END IF;
    
    -- Avoid sending the same notification multiple times
    IF NEW.last_notification_sent_at IS NULL OR 
       NEW.last_notification_sent_at < (now() - INTERVAL '1 hour') THEN
      
      BEGIN
        -- Call Edge Function to send Telegram notification
        PERFORM
          net.http_post(
            url:='https://api.partsbay.ae/functions/v1/telegram-product-notification',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
            body:=jsonb_build_object(
              'productId', NEW.id,
              'status', NEW.status,
              'title', NEW.title,
              'price', NEW.price,
              'seller_name', NEW.seller_name,
              'product_url', NEW.product_url
            )
          );
          
        -- Update the last notification timestamp
        UPDATE public.products 
        SET last_notification_sent_at = now() 
        WHERE id = NEW.id;
        
        RAISE LOG 'Telegram notification sent for product % with status %', NEW.id, NEW.status;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'Error sending Telegram notification for product %: %', NEW.id, SQLERRM;
          -- Don't halt execution, just log the error
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;