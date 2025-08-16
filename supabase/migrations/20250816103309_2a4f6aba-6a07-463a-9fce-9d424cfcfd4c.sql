-- Fix database functions and triggers that reference removed container_status field

-- 1. Update track_order_modifications function to remove container_status references
CREATE OR REPLACE FUNCTION public.track_order_modifications()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Track if order has been modified (excluding automatic updates)
  IF TG_OP = 'UPDATE' THEN
    -- Check if meaningful fields have changed (excluding system fields)
    IF OLD.title IS DISTINCT FROM NEW.title OR
       OLD.price IS DISTINCT FROM NEW.price OR
       OLD.status IS DISTINCT FROM NEW.status OR
       OLD.place_number IS DISTINCT FROM NEW.place_number OR
       OLD.delivery_method IS DISTINCT FROM NEW.delivery_method OR
       OLD.brand IS DISTINCT FROM NEW.brand OR
       OLD.model IS DISTINCT FROM NEW.model OR
       OLD.description IS DISTINCT FROM NEW.description OR
       OLD.text_order IS DISTINCT FROM NEW.text_order OR
       OLD.delivery_price_confirm IS DISTINCT FROM NEW.delivery_price_confirm OR
       OLD.images IS DISTINCT FROM NEW.images OR
       OLD.video_url IS DISTINCT FROM NEW.video_url OR
       OLD.container_number IS DISTINCT FROM NEW.container_number THEN
      
      NEW.is_modified = true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Update create_order_shipments function to remove container_status references
CREATE OR REPLACE FUNCTION public.create_order_shipments()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  i INTEGER;
BEGIN
  -- Only create shipments for new orders (INSERT operation)
  IF TG_OP = 'INSERT' THEN
    -- Create individual shipment records for each place
    FOR i IN 1..NEW.place_number LOOP
      INSERT INTO public.order_shipments (
        order_id,
        place_number,
        shipment_status,
        container_number
      ) VALUES (
        NEW.id,
        i,
        COALESCE(NEW.shipment_status, 'not_shipped'::shipment_status),
        NEW.container_number
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Remove the update_container_status_and_sync function as it's no longer needed
DROP FUNCTION IF EXISTS public.update_container_status_and_sync(uuid, container_status);

-- 4. Remove the sync_container_status_on_shipment_update function and its trigger
DROP TRIGGER IF EXISTS sync_container_status_trigger ON public.order_shipments;
DROP FUNCTION IF EXISTS public.sync_container_status_on_shipment_update();

-- 5. Ensure all triggers are properly attached to the updated functions
DROP TRIGGER IF EXISTS track_order_modifications_trigger ON public.orders;
CREATE TRIGGER track_order_modifications_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.track_order_modifications();

DROP TRIGGER IF EXISTS create_order_shipments_trigger ON public.orders;
CREATE TRIGGER create_order_shipments_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_order_shipments();