-- Create RPC function to get shipment summary for multiple orders in one batch query
-- This solves N+1 problem where each order was making a separate query

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
  SELECT 
    os.order_id,
    COUNT(*)::INT as total_places,
    COUNT(*) FILTER (WHERE os.shipment_status = 'in_transit')::INT as shipped_places,
    CASE 
      WHEN COUNT(*) FILTER (WHERE os.shipment_status = 'in_transit') = 0 THEN 'not_shipped'
      WHEN COUNT(*) FILTER (WHERE os.shipment_status = 'in_transit') = COUNT(*) THEN 'in_transit'
      ELSE 'partially_shipped'
    END::TEXT as calculated_status,
    jsonb_agg(
      DISTINCT jsonb_build_object(
        'containerNumber', os.container_number,
        'placesCount', COUNT(*) FILTER (WHERE os.container_number = os.container_number),
        'status', os.shipment_status
      )
    ) FILTER (WHERE os.container_number IS NOT NULL) as containers_info
  FROM public.order_shipments os
  WHERE os.order_id = ANY(order_ids)
  GROUP BY os.order_id;
END;
$$;