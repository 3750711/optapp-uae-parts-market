-- Restore and update the notify_registered_order_status function to handle seller_confirmed status
CREATE OR REPLACE FUNCTION public.notify_registered_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  notification_data jsonb;
BEGIN
  RAISE LOG 'Registered order status trigger fired for order %, TG_OP: %, status: %', NEW.id, TG_OP, NEW.status;

  -- Для INSERT и UPDATE когда статус становится processed или seller_confirmed
  IF (TG_OP = 'INSERT' AND NEW.status IN ('processed', 'seller_confirmed')) OR 
     (TG_OP = 'UPDATE' AND OLD.status NOT IN ('processed', 'seller_confirmed') AND NEW.status IN ('processed', 'seller_confirmed')) THEN
    
    RAISE LOG 'Sending registered order notification for order #%', NEW.order_number;
    
    -- Получаем все изображения заказа
    notification_data := jsonb_build_object(
      'order', to_jsonb(NEW),
      'action', CASE 
        WHEN TG_OP = 'INSERT' AND NEW.status IN ('processed', 'seller_confirmed') THEN 'registered'
        WHEN TG_OP = 'INSERT' THEN 'create'
        WHEN TG_OP = 'UPDATE' AND NEW.status IN ('processed', 'seller_confirmed') THEN 'registered'
        ELSE 'status_change'
      END
    );

    -- Вызываем Edge Function для отправки уведомления через proxy
    BEGIN
      PERFORM net.http_post(
        url := public.functions_url('/functions/v1/send-telegram-notification'),
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := notification_data
      );
      RAISE LOG 'Successfully triggered registered notification for order #%', NEW.order_number;
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Error triggering registered notification for order #%: %', NEW.order_number, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_registered_order_status ON public.orders;

-- Create the trigger for registered order notifications
CREATE TRIGGER trigger_notify_registered_order_status
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_registered_order_status();