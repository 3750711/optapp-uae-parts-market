-- Recreate the missing trigger for product status change notifications
-- This trigger was somehow deleted and needs to be restored

-- First, let's make sure the function exists and is properly configured
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RAISE LOG 'Product status change trigger fired: OLD.status=%, NEW.status=%, product_id=%', 
    COALESCE(OLD.status::text, 'NULL'), NEW.status, NEW.id;
  
  -- Only notify on status changes, not inserts
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    RAISE LOG 'Creating bilingual notification for product % status change from % to %', 
      NEW.id, OLD.status, NEW.status;
    
    -- Try to create bilingual notification and log result
    BEGIN
      PERFORM create_bilingual_notification(
        NEW.seller_id,
        'PRODUCT_STATUS_CHANGE',
        jsonb_build_object(
          'product_id', NEW.id,
          'title', NEW.title,
          'old_status', OLD.status,
          'status', NEW.status,
          'url', '/product/' || NEW.id
        )
      );
      
      RAISE LOG 'Successfully created bilingual notification for product %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Error creating bilingual notification for product %: %', NEW.id, SQLERRM;
    END;
    
    -- Add direct Edge Function call for Telegram notification
    BEGIN
      -- Update timestamp first
      NEW.last_notification_sent_at := NOW();
      
      -- Call edge function directly for Telegram notification
      PERFORM
        net.http_post(
          url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-telegram-notification',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || 
                   current_setting('app.settings.service_role_key', true) || '"}',
          body:=jsonb_build_object(
            'action', 'status_change',
            'productId', NEW.id,
            'type', 'product'
          )::text
        );
      
      RAISE LOG 'Called Edge Function for product % Telegram notification', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Error calling Edge Function for product %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Now create the trigger that was missing
DROP TRIGGER IF EXISTS trigger_notify_on_product_status_changes ON public.products;

CREATE TRIGGER trigger_notify_on_product_status_changes
  AFTER UPDATE OF status ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_product_status_changes();