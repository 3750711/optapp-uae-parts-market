-- Remove net.http_post() from the trigger and simplify to only handle metadata updates
CREATE OR REPLACE FUNCTION notify_on_product_status_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'active' or 'sold'
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status IN ('active', 'sold')) OR
     (TG_OP = 'INSERT' AND NEW.status IN ('active', 'sold')) THEN
    
    -- Update the last notification timestamp
    NEW.last_notification_sent_at = now();
    
    -- Log the event for debugging (optional)
    INSERT INTO event_logs (entity_type, entity_id, action_type, details)
    VALUES (
      'product',
      NEW.id,
      'status_change_notification_scheduled',
      jsonb_build_object(
        'status', NEW.status,
        'lot_number', NEW.lot_number,
        'title', NEW.title,
        'notification_type', CASE WHEN NEW.status = 'sold' THEN 'sold' ELSE 'status_change' END
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;