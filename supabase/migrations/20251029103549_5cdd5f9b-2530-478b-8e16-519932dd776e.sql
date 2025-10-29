-- Fix: Replace 'role' with 'user_type' in RPC functions access control

-- Fix get_orders_shipment_summary to use user_type instead of role
DROP FUNCTION IF EXISTS public.get_orders_shipment_summary(UUID[]);

CREATE OR REPLACE FUNCTION public.get_orders_shipment_summary(order_ids UUID[])
RETURNS TABLE (
  order_id UUID,
  total_places INT,
  shipped_places INT,
  calculated_status TEXT,
  containers_info JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Check if user is admin using user_type column
  SELECT user_type::text INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF user_role IS NULL OR user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Only administrators can use this function.';
  END IF;

  RETURN QUERY
  WITH container_counts AS (
    -- First, count places for each container
    SELECT 
      os.order_id,
      os.container_number,
      COUNT(*) as places_count,
      os.shipment_status
    FROM public.order_shipments os
    WHERE os.order_id = ANY(order_ids)
      AND os.container_number IS NOT NULL
    GROUP BY os.order_id, os.container_number, os.shipment_status
  ),
  order_stats AS (
    -- Calculate total statistics per order
    SELECT 
      os.order_id,
      COUNT(*) as total_places,
      COUNT(*) FILTER (WHERE os.shipment_status = 'in_transit') as shipped_places
    FROM public.order_shipments os
    WHERE os.order_id = ANY(order_ids)
    GROUP BY os.order_id
  )
  SELECT 
    os_stats.order_id,
    os_stats.total_places::INT,
    os_stats.shipped_places::INT,
    CASE 
      WHEN os_stats.shipped_places = 0 THEN 'not_shipped'
      WHEN os_stats.shipped_places = os_stats.total_places THEN 'in_transit'
      ELSE 'partially_shipped'
    END::TEXT as calculated_status,
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'containerNumber', cc.container_number,
          'placesCount', cc.places_count,
          'status', cc.shipment_status
        )
      ) FILTER (WHERE cc.container_number IS NOT NULL),
      '[]'::jsonb
    ) as containers_info
  FROM order_stats os_stats
  LEFT JOIN container_counts cc ON cc.order_id = os_stats.order_id
  GROUP BY os_stats.order_id, os_stats.total_places, os_stats.shipped_places;
END;
$$;

-- Fix update_multiple_shipments to use user_type instead of role
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
      shipment_status = CASE 
        WHEN shipment ? 'shipment_status' THEN (shipment->>'shipment_status')::TEXT
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
GRANT EXECUTE ON FUNCTION public.get_orders_shipment_summary(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_multiple_shipments(JSONB) TO authenticated;