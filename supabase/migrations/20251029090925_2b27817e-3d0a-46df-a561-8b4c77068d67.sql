-- Add validation trigger to prevent in_transit status without container_number
CREATE OR REPLACE FUNCTION public.validate_shipment_container()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if status is in_transit but container_number is NULL or empty
  IF NEW.shipment_status = 'in_transit' AND (NEW.container_number IS NULL OR trim(NEW.container_number) = '') THEN
    RAISE EXCEPTION 'Невозможно установить статус "Отправлен" без указания контейнера';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on order_shipments table
DROP TRIGGER IF EXISTS validate_shipment_container_trigger ON public.order_shipments;

CREATE TRIGGER validate_shipment_container_trigger
BEFORE INSERT OR UPDATE ON public.order_shipments
FOR EACH ROW
EXECUTE FUNCTION public.validate_shipment_container();