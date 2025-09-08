-- COMPLETE FORWARD MIGRATION: Fix ALL hardcoded Edge Function URLs
-- This migration replaces ALL remaining hardcoded function URLs with public.functions_url() calls
-- and adds comprehensive protection against future hardcode regressions

-- Function: notify_pusher_price_offer_changes
CREATE OR REPLACE FUNCTION public.notify_pusher_price_offer_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    
    -- Send real-time notification via Edge Function (using public.functions_url)
    BEGIN
      PERFORM
        net.http_post(
          url := public.functions_url('send-pusher-notification'),
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := jsonb_build_object(
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
          url := public.functions_url('send-pusher-notification'),
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := jsonb_build_object(
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

-- Function: notify_on_product_status_changes (main product notification function)
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Send notification only when status changes to:
  -- 1. active (published) - will send full ad with images
  -- 2. sold (sold) - will send sale notification  
  -- DON'T send notifications when changing to pending (moderation)
  IF (TG_OP = 'UPDATE' AND 
      ((OLD.status != 'active' AND NEW.status = 'active') OR 
       (OLD.status != 'sold' AND NEW.status = 'sold'))) THEN
    
    -- If status changed to sold, send notification in any case, even without images
    -- For active status check if images exist
    IF (NEW.status = 'sold' OR 
        (NEW.status = 'active' AND EXISTS (
          SELECT 1 FROM product_images WHERE product_id = NEW.id LIMIT 1
        ))) THEN
      -- Update timestamp of last notification
      NEW.last_notification_sent_at := NOW();
      
      -- Determine notification type
      DECLARE
        notification_type TEXT;
      BEGIN
        IF NEW.status = 'sold' THEN
          notification_type := 'sold';
        ELSIF NEW.status = 'active' THEN
          -- For active status send full ad, not status_change
          notification_type := 'product_published';
        ELSE
          notification_type := 'status_change';
        END IF;
        
        -- Call Edge Function using public.functions_url() - FIXED HARDCODE
        PERFORM
          net.http_post(
            url := public.functions_url('send-telegram-notification'),
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := jsonb_build_object('productId', NEW.id, 'notificationType', notification_type)
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

-- Function: notify_on_order_status_changes
CREATE OR REPLACE FUNCTION public.notify_on_order_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only notify on status changes, not inserts
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify both buyer and seller about status change
    PERFORM create_bilingual_notification(
      NEW.buyer_id,
      'ORDER_STATUS_CHANGE',
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'old_status', OLD.status,
        'status', NEW.status,
        'url', '/orders/' || NEW.id
      )
    );
    
    PERFORM create_bilingual_notification(
      NEW.seller_id,
      'ORDER_STATUS_CHANGE',
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'old_status', OLD.status,
        'status', NEW.status,
        'url', '/orders/' || NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function: send_periodic_admin_notifications
CREATE OR REPLACE FUNCTION public.send_periodic_admin_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Send periodic admin notifications using public.functions_url() - FIXED HARDCODE
  PERFORM
    net.http_post(
      url := public.functions_url('send-periodic-admin-notifications'),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{"type": "periodic"}'::jsonb
    );
END;
$function$;

-- Function: notify_admins_new_product  
CREATE OR REPLACE FUNCTION public.notify_admins_new_product()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Notify admins of new product using public.functions_url() - FIXED HARDCODE
  PERFORM
    net.http_post(
      url := public.functions_url('notify-admins-new-product'),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object('productId', NEW.id)
    );
  
  RETURN NEW;
END;
$function$;

-- Function: notify_seller_new_price_offer
CREATE OR REPLACE FUNCTION public.notify_seller_new_price_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Notify seller of new price offer using public.functions_url() - FIXED HARDCODE
  PERFORM
    net.http_post(
      url := public.functions_url('notify-seller-new-price-offer'),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object('offerId', NEW.id, 'productId', NEW.product_id)
    );
  
  RETURN NEW;
END;
$function$;

-- Function: notify_user_welcome_registration
CREATE OR REPLACE FUNCTION public.notify_user_welcome_registration(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Send welcome registration using public.functions_url() - FIXED HARDCODE
  PERFORM
    net.http_post(
      url := public.functions_url('notify-user-welcome-registration'),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object('userId', user_id_param)
    );
END;
$function$;

-- Function: send_welcome_message
CREATE OR REPLACE FUNCTION public.send_welcome_message(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Send welcome message using public.functions_url() - FIXED HARDCODE
  PERFORM
    net.http_post(
      url := public.functions_url('send-welcome-message'),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object('userId', user_id_param)
    );
END;
$function$;

-- Function: notify_admins_new_user
CREATE OR REPLACE FUNCTION public.notify_admins_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Notify admins of new user using public.functions_url() - FIXED HARDCODE
  PERFORM
    net.http_post(
      url := public.functions_url('notify-admins-new-user'),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object('userId', NEW.id)
    );
  
  RETURN NEW;
END;
$function$;

-- Function: send_product_sold_notification
CREATE OR REPLACE FUNCTION public.send_product_sold_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Send product sold notification using public.functions_url() - FIXED HARDCODE
  PERFORM
    net.http_post(
      url := public.functions_url('send-product-sold-notification'),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object('productId', NEW.id)
    );
  
  RETURN NEW;
END;
$function$;

-- Create admin schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS admin;

-- Create a comprehensive view to check for remaining hardcoded URLs in functions
CREATE OR REPLACE VIEW admin.v_functions_with_hardcoded_urls AS
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition,
  CASE 
    WHEN pg_get_functiondef(p.oid) ILIKE '%.supabase.co/functions/v1%' THEN 'supabase.co hardcode'
    WHEN pg_get_functiondef(p.oid) ILIKE '%api.partsbay.ae/functions/v1%' THEN 'partsbay.ae hardcode'
    WHEN pg_get_functiondef(p.oid) ILIKE '%/functions/v1/%' THEN 'generic functions/v1 hardcode'
    ELSE 'other hardcode'
  END as hardcode_type
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND (
    pg_get_functiondef(p.oid) ILIKE '%/functions/v1/%' OR
    pg_get_functiondef(p.oid) ILIKE '%api.partsbay.ae/functions/v1%' OR
    pg_get_functiondef(p.oid) ILIKE '%.supabase.co/functions/v1%'
  )
ORDER BY n.nspname, p.proname;

-- Add comprehensive protection check
DO $$
DECLARE 
  hardcode_count integer;
  example_function text;
  hardcode_record RECORD;
  all_hardcodes text := '';
BEGIN
  -- Check for hardcoded URLs
  SELECT count(*) INTO hardcode_count FROM admin.v_functions_with_hardcoded_urls;
  
  IF hardcode_count > 0 THEN
    -- Get first few examples for the error message
    FOR hardcode_record IN 
      SELECT schema_name, function_name, hardcode_type
      FROM admin.v_functions_with_hardcoded_urls
      ORDER BY schema_name, function_name
      LIMIT 3
    LOOP
      all_hardcodes := all_hardcodes || hardcode_record.schema_name || '.' || hardcode_record.function_name || ' (' || hardcode_record.hardcode_type || '); ';
    END LOOP;
    
    RAISE EXCEPTION 'Migration validation FAILED: Found % function(s) with hardcoded /functions/v1 URLs. Examples: %. All functions must use public.functions_url()', 
      hardcode_count, all_hardcodes;
  ELSE
    RAISE NOTICE 'Migration validation PASSED: No hardcoded URLs found in database functions';
    RAISE NOTICE 'System is now fully proxy-ready with 0 hardcodes in active PostgreSQL functions';
  END IF;
END
$$;

-- Add success confirmation message
DO $$
BEGIN
  RAISE NOTICE '=== HARDCODE CLEANUP COMPLETE ===';
  RAISE NOTICE 'All Edge Function URLs now use public.functions_url()';
  RAISE NOTICE 'Protective view admin.v_functions_with_hardcoded_urls created';
  RAISE NOTICE 'System is proxy-ready for any domain/environment changes';
  RAISE NOTICE 'Total hardcodes in active functions: 0';
END
$$;