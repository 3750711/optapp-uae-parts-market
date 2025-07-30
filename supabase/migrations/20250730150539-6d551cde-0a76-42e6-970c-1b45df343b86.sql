-- Create trigger function to notify admins about new pending products
CREATE OR REPLACE FUNCTION public.notify_admins_new_pending_product()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for new products with pending status
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    -- Call the edge function to notify admins
    PERFORM
      net.http_post(
        url := 'https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/notify-admins-new-product',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'productId', NEW.id
        )
      );
    
    RAISE LOG 'Triggered admin notification for new pending product: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_notify_admins_new_pending_product ON public.products;
CREATE TRIGGER trigger_notify_admins_new_pending_product
  AFTER INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_pending_product();