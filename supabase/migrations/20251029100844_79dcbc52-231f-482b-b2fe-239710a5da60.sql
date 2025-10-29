-- Fix critical error in get_orders_shipment_summary: nested aggregate functions
-- Rewrite using CTE to avoid nested aggregates

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
BEGIN
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

-- Also fix security warning for validate_shipment_container
CREATE OR REPLACE FUNCTION public.validate_shipment_container()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.shipment_status = 'in_transit' AND 
     (NEW.container_number IS NULL OR trim(NEW.container_number) = '') THEN
    RAISE EXCEPTION 'Невозможно установить статус "Отправлен" без указания контейнера';
  END IF;
  RETURN NEW;
END;
$$;