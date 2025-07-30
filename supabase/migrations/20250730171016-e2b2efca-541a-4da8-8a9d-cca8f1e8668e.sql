-- Add new field for tracking admin notifications
ALTER TABLE public.products 
ADD COLUMN admin_notification_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for efficient querying of pending products needing notifications
CREATE INDEX idx_products_pending_admin_notifications 
ON public.products (status, admin_notification_sent_at) 
WHERE status = 'pending';

-- Update existing notify_on_product_status_changes trigger to reset admin notification field
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only notify on status changes, not inserts
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Reset admin notification field when product status changes from pending
    IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
      NEW.admin_notification_sent_at = NULL;
    END IF;
    
    -- Send Telegram notification for status change
    RAISE LOG 'notify_on_product_status_changes triggered: TG_OP=%, OLD.status=%, NEW.status=%', TG_OP, OLD.status, NEW.status;
    
    INSERT INTO public.telegram_notifications_queue (
      product_id,
      notification_type,
      created_at
    ) VALUES (
      NEW.id,
      'status_change',
      NOW()
    );
    
    RAISE LOG 'Sending Telegram notification for product % with type %', NEW.id, 'status_change';
  END IF;
  
  RETURN NEW;
END;
$function$;