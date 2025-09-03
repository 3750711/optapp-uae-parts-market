-- Update all database functions to use correct Supabase URL instead of api.partsbay.ae
-- This migration fixes hardcoded URLs in database functions

-- Function: notify_pusher_price_offer_changes
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
          url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-pusher-notification',
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
          url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-pusher-notification',
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

-- Function: notify_seller_product_sold
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
          url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-telegram-notification',
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

-- Function: admin_resend_welcome  
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
        url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-welcome-message',
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