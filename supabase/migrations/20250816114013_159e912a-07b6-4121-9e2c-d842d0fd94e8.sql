-- Fix shipment status type mismatch in create_order_shipments function
CREATE OR REPLACE FUNCTION public.create_order_shipments()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  i INTEGER;
  mapped_status shipment_status_individual;
BEGIN
  -- Only create shipments for new orders (INSERT operation)
  IF TG_OP = 'INSERT' THEN
    -- Map shipment_status to shipment_status_individual
    CASE NEW.shipment_status
      WHEN 'not_shipped' THEN mapped_status := 'not_shipped'::shipment_status_individual;
      WHEN 'partially_shipped' THEN mapped_status := 'not_shipped'::shipment_status_individual; -- Default for individual shipments
      WHEN 'in_transit' THEN mapped_status := 'in_transit'::shipment_status_individual;
      ELSE mapped_status := 'not_shipped'::shipment_status_individual; -- Fallback
    END CASE;

    -- Create individual shipment records for each place
    FOR i IN 1..NEW.place_number LOOP
      INSERT INTO public.order_shipments (
        order_id, 
        place_number, 
        container_number, 
        shipment_status
      ) VALUES (
        NEW.id,
        i,
        NEW.container_number,
        mapped_status
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;