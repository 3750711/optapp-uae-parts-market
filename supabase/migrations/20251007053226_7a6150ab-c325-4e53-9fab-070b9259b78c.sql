-- Update notify_on_order_status_changes to automatically send Telegram notifications for registered orders
CREATE OR REPLACE FUNCTION public.notify_on_order_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only notify on status changes, not inserts
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Create internal notifications for buyer and seller
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
    
    -- Send Telegram notification for registered orders (processed status)
    IF NEW.status = 'processed' THEN
      BEGIN
        RAISE LOG 'Sending registered order notification for order #%', NEW.order_number;
        
        PERFORM net.http_post(
          url := public.functions_url('/functions/v1/send-telegram-notification'),
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := jsonb_build_object(
            'action', 'registered',
            'order', row_to_json(NEW)
          )
        );
        
        RAISE LOG 'Successfully triggered registered notification for order #%', NEW.order_number;
      EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Error sending registered order notification for order #%: %', NEW.order_number, SQLERRM;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;