-- Fix type casting in update_multiple_shipments function
-- The issue: shipment_status column is of type shipment_status_individual (enum), not text
-- We need to cast JSON values to the correct enum type

CREATE OR REPLACE FUNCTION public.update_multiple_shipments(
  shipment_updates JSONB
) RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  shipment JSONB;
  user_role TEXT;
BEGIN
  -- Check if user is admin using user_type column
  SELECT user_type::text INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF user_role IS NULL OR user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Only administrators can use this function.';
  END IF;

  -- All updates happen in a transaction (implicit in function)
  FOR shipment IN SELECT * FROM jsonb_array_elements(shipment_updates)
  LOOP
    UPDATE public.order_shipments
    SET 
      container_number = CASE 
        WHEN shipment ? 'container_number' THEN (shipment->>'container_number')::TEXT
        ELSE container_number
      END,
      -- FIX: Cast to shipment_status_individual enum, not TEXT
      shipment_status = CASE 
        WHEN shipment ? 'shipment_status' THEN (shipment->>'shipment_status')::shipment_status_individual
        ELSE shipment_status
      END,
      description = CASE 
        WHEN shipment ? 'description' THEN (shipment->>'description')::TEXT
        ELSE description
      END,
      updated_at = NOW()
    WHERE id = (shipment->>'id')::UUID;
    
    -- Check if row was actually updated
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Shipment with id % not found', (shipment->>'id');
    END IF;
  END LOOP;
END;
$$;

-- Ensure execute permissions
GRANT EXECUTE ON FUNCTION public.update_multiple_shipments(JSONB) TO authenticated;