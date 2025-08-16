-- Fix inconsistent order shipment statuses
-- Update orders that have shipments but wrong status in the orders table

-- First, let's create a function to calculate correct order status
CREATE OR REPLACE FUNCTION calculate_order_shipment_status(p_order_id UUID)
RETURNS TEXT AS $$
DECLARE
  total_places INTEGER;
  shipped_places INTEGER;
  calculated_status TEXT;
BEGIN
  -- Count total and shipped places for this order
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE shipment_status = 'in_transit') as shipped
  INTO total_places, shipped_places
  FROM order_shipments 
  WHERE order_id = p_order_id;
  
  -- If no shipments exist, return the current order status
  IF total_places = 0 THEN
    SELECT shipment_status INTO calculated_status
    FROM orders WHERE id = p_order_id;
    RETURN calculated_status;
  END IF;
  
  -- Calculate status based on shipment distribution
  IF shipped_places = 0 THEN
    calculated_status := 'not_shipped';
  ELSIF shipped_places = total_places THEN
    calculated_status := 'in_transit';
  ELSE
    calculated_status := 'partially_shipped';
  END IF;
  
  RETURN calculated_status;
END;
$$ LANGUAGE plpgsql;

-- Update all orders that have shipments with incorrect status
WITH order_status_updates AS (
  SELECT 
    o.id,
    o.shipment_status as current_status,
    calculate_order_shipment_status(o.id) as calculated_status
  FROM orders o
  WHERE EXISTS (
    SELECT 1 FROM order_shipments os WHERE os.order_id = o.id
  )
)
UPDATE orders 
SET shipment_status = osu.calculated_status::shipment_status
FROM order_status_updates osu
WHERE orders.id = osu.id 
  AND orders.shipment_status != osu.calculated_status::shipment_status;

-- Log the changes made
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % orders with corrected shipment statuses', updated_count;
END $$;