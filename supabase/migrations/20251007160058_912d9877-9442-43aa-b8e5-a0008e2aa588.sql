-- Fix notify_on_new_order function to send notifications for both INSERT and UPDATE
-- This function sends to group -4749346030 (All Orders)
CREATE OR REPLACE FUNCTION public.notify_on_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  notification_data jsonb;
  action_type text;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'create';
    RAISE LOG 'New order created: #%, sending create notification to all orders group', NEW.order_number;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    action_type := 'status_change';
    RAISE LOG 'Order #% status changed from % to %, sending status_change notification to all orders group', 
              NEW.order_number, OLD.status, NEW.status;
  ELSE
    -- Skip UPDATE without status change
    RETURN NEW;
  END IF;

  -- Prepare notification data
  notification_data := jsonb_build_object(
    'order', to_jsonb(NEW),
    'action', action_type
  );

  -- Send notification via proxy
  BEGIN
    PERFORM net.http_post(
      url := public.functions_url('/functions/v1/send-telegram-notification'),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := notification_data
    );
    RAISE LOG 'Successfully sent % notification for order #% to all orders group', action_type, NEW.order_number;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error sending % notification for order #%: %', action_type, NEW.order_number, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Recreate trigger to handle both INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_notify_on_new_order ON public.orders;

CREATE TRIGGER trigger_notify_on_new_order
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW 
  EXECUTE FUNCTION public.notify_on_new_order();

-- Fix notify_registered_order_status function to send ONLY for 'processed' status
-- This function sends to group -1002024698284 (Registered Orders)
CREATE OR REPLACE FUNCTION public.notify_registered_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  notification_data jsonb;
BEGIN
  RAISE LOG 'Registered order trigger fired for order %, TG_OP: %, status: %', NEW.id, TG_OP, NEW.status;

  -- Send ONLY when status becomes 'processed'
  IF (TG_OP = 'INSERT' AND NEW.status = 'processed') OR 
     (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'processed') THEN
    
    RAISE LOG 'Order #% became processed, sending registered notification', NEW.order_number;
    
    notification_data := jsonb_build_object(
      'order', to_jsonb(NEW),
      'action', 'registered'
    );

    -- Send via proxy
    BEGIN
      PERFORM net.http_post(
        url := public.functions_url('/functions/v1/send-telegram-notification'),
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := notification_data
      );
      RAISE LOG 'Successfully sent registered notification for order #%', NEW.order_number;
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Error sending registered notification for order #%: %', NEW.order_number, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;