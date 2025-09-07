-- Forward migration to fix hardcoded Edge Function URLs in database functions
-- Replace all hardcoded URLs with public.functions_url() calls

-- Function: notify_pusher_price_offer_changes
CREATE OR REPLACE FUNCTION public.notify_pusher_price_offer_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
    
    -- Send real-time notification via Edge Function (without authorization header)
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

-- Function: notify_on_product_status_changes  
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
        
        -- Call Edge Function to send notification
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

-- Create admin schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS admin;

-- Create a view to check for remaining hardcoded URLs in functions
CREATE OR REPLACE VIEW admin.v_functions_with_hardcoded_urls AS
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND (
    pg_get_functiondef(p.oid) ILIKE '%/functions/v1/%' OR
    pg_get_functiondef(p.oid) ILIKE '%api.partsbay.ae/functions/v1%' OR
    pg_get_functiondef(p.oid) ILIKE '%.supabase.co/functions/v1%'
  )
ORDER BY n.nspname, p.proname;

-- Add a protective check that will fail the migration if hardcoded URLs still exist
DO $$
DECLARE 
  hardcode_count integer;
  example_function text;
  hardcode_record RECORD;
BEGIN
  -- Check for hardcoded URLs
  hardcode_count := 0;
  example_function := '';
  
  FOR hardcode_record IN 
    SELECT schema_name, function_name 
    FROM admin.v_functions_with_hardcoded_urls
    LIMIT 1
  LOOP
    hardcode_count := hardcode_count + 1;
    example_function := hardcode_record.schema_name || '.' || hardcode_record.function_name;
  END LOOP;
  
  IF hardcode_count > 0 THEN
    RAISE EXCEPTION 'Migration validation failed: Found hardcoded /functions/v1 URLs in function %. Please fix all functions to use public.functions_url()', 
      example_function;
  ELSE
    RAISE NOTICE 'Migration validation passed: No hardcoded URLs found in database functions';
  END IF;
END
$$;