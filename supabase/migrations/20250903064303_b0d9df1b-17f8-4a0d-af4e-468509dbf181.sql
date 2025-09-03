-- Update all database functions to use custom domain api.partsbay.ae instead of vfiylfljiixqkjfqubyq.supabase.co

-- Update admin_resend_welcome function
CREATE OR REPLACE FUNCTION public.admin_resend_welcome(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_record RECORD;
  result JSON;
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Only administrators can use this function'
    );
  END IF;
  
  -- Get user details
  SELECT * INTO user_record
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User not found'
    );
  END IF;
  
  -- Log the operation
  RAISE LOG 'Admin % resending welcome to user %', auth.uid(), p_user_id;
  
  -- Send welcome message via Edge Function
  BEGIN
    PERFORM
      net.http_post(
        url:='https://api.partsbay.ae/functions/v1/send-welcome-message',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
        body:=jsonb_build_object(
          'userId', p_user_id,
          'userType', user_record.user_type,
          'forceOverride', true
        )
      );
    RAISE LOG 'Welcome message resent for user %', p_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error resending welcome message for user %: %', p_user_id, SQLERRM;
      RETURN json_build_object(
        'success', false,
        'message', 'Error sending welcome message: ' || SQLERRM
      );
  END;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Welcome message resent successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in admin_resend_welcome: %', SQLERRM;
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$function$;

-- Update create_price_offer_notification function
CREATE OR REPLACE FUNCTION public.create_price_offer_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  seller_record RECORD;
  buyer_record RECORD;
  product_record RECORD;
BEGIN
  -- Get seller, buyer, and product details
  SELECT * INTO seller_record FROM public.profiles WHERE id = NEW.seller_id;
  SELECT * INTO buyer_record FROM public.profiles WHERE id = NEW.buyer_id;
  SELECT * INTO product_record FROM public.products WHERE id = NEW.product_id;
  
  -- Create notification for seller
  PERFORM create_bilingual_notification(
    NEW.seller_id,
    'PRICE_OFFER',
    jsonb_build_object(
      'offer_id', NEW.id,
      'product_id', NEW.product_id,
      'product_title', product_record.title,
      'buyer_name', buyer_record.full_name,
      'original_price', NEW.original_price,
      'offered_price', NEW.offered_price,
      'message', NEW.message,
      'url', '/price-offers/' || NEW.id
    )
  );
  
  -- Send Telegram notification to seller
  BEGIN
    PERFORM
      net.http_post(
        url:='https://api.partsbay.ae/functions/v1/notify-seller-new-price-offer',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
        body:=jsonb_build_object(
          'offerId', NEW.id,
          'sellerId', NEW.seller_id,
          'productId', NEW.product_id,
          'buyerId', NEW.buyer_id,
          'originalPrice', NEW.original_price,
          'offeredPrice', NEW.offered_price,
          'message', NEW.message
        )
      );
    RAISE LOG 'Telegram notification sent for price offer %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error sending Telegram notification for price offer %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$function$;

-- Update notify_on_order_creation function
CREATE OR REPLACE FUNCTION public.notify_on_order_creation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Only notify on insert, not updates
  IF TG_OP = 'INSERT' THEN
    -- Create bilingual notifications for both buyer and seller
    PERFORM create_bilingual_notification(
      NEW.buyer_id,
      'ORDER_CREATED',
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'title', NEW.title,
        'price', NEW.price,
        'url', '/orders/' || NEW.id
      )
    );
    
    PERFORM create_bilingual_notification(
      NEW.seller_id,
      'NEW_ORDER',
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'title', NEW.title,
        'price', NEW.price,
        'url', '/orders/' || NEW.id
      )
    );
    
    -- Send Telegram notification
    BEGIN
      PERFORM
        net.http_post(
          url:='https://api.partsbay.ae/functions/v1/send-telegram-notification',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
          body:=jsonb_build_object(
            'orderId', NEW.id,
            'action', 'created'
          )
        );
      RAISE LOG 'Telegram notification sent for new order %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending Telegram notification for order %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update notify_pusher_price_offer_changes function
CREATE OR REPLACE FUNCTION public.notify_pusher_price_offer_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  channel_name TEXT;
  event_data JSONB;
BEGIN
  -- Only notify on updates, not inserts
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Create channel name for the buyer
    channel_name := 'price-offer-' || NEW.buyer_id::text;
    
    -- Prepare event data
    event_data := jsonb_build_object(
      'offer_id', NEW.id,
      'product_id', NEW.product_id,
      'status', NEW.status,
      'seller_response', NEW.seller_response,
      'updated_at', NEW.updated_at
    );
    
    -- Send real-time notification via Edge Function
    BEGIN
      PERFORM
        net.http_post(
          url:='https://api.partsbay.ae/functions/v1/send-pusher-notification',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
          body:=jsonb_build_object(
            'channel', channel_name,
            'event', 'price-offer-updated',
            'data', event_data
          )
        );
      RAISE LOG 'Pusher notification sent for price offer % status change to %', NEW.id, NEW.status;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending Pusher notification for price offer %: %', NEW.id, SQLERRM;
    END;

    -- Also send notification to seller channel
    channel_name := 'price-offer-seller-' || NEW.seller_id::text;
    
    BEGIN
      PERFORM
        net.http_post(
          url:='https://api.partsbay.ae/functions/v1/send-pusher-notification',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
          body:=jsonb_build_object(
            'channel', channel_name,
            'event', 'price-offer-updated',
            'data', event_data
          )
        );
      RAISE LOG 'Pusher notification sent to seller for price offer %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending Pusher notification to seller for price offer %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update notify_registered_order_status function
CREATE OR REPLACE FUNCTION public.notify_registered_order_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Only notify on status changes, not inserts
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Send notification via Edge Function
    BEGIN
      PERFORM
        net.http_post(
          url:='https://api.partsbay.ae/functions/v1/send-telegram-notification',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
          body:=jsonb_build_object(
            'orderId', NEW.id,
            'action', 'status_changed',
            'oldStatus', OLD.status,
            'newStatus', NEW.status
          )
        );
      RAISE LOG 'Telegram notification sent for order % status change from % to %', NEW.id, OLD.status, NEW.status;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending Telegram notification for order % status change: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update notify_seller_product_sold function
CREATE OR REPLACE FUNCTION public.notify_seller_product_sold()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Only notify when status changes to 'sold'
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'sold' THEN
    -- Send notification via Edge Function
    BEGIN
      PERFORM
        net.http_post(
          url:='https://api.partsbay.ae/functions/v1/send-telegram-notification',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
          body:=jsonb_build_object(
            'productId', NEW.id,
            'sellerId', NEW.seller_id,
            'notificationType', 'product_sold'
          )
        );
      RAISE LOG 'Product sold notification sent for product %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending product sold notification for product %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update notify_admins_new_pending_user function (already updated in current code, but ensuring consistency)
CREATE OR REPLACE FUNCTION public.notify_admins_new_pending_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;