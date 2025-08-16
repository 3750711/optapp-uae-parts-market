-- Fix the specific order with incorrect place number and create missing shipments
UPDATE public.orders 
SET place_number = 14 
WHERE id = '40cefd3c-29bc-4d33-92ba-ec0568a4edd8';

-- Create missing shipment records for places 2-14
INSERT INTO public.order_shipments (order_id, place_number, shipment_status)
SELECT 
  '40cefd3c-29bc-4d33-92ba-ec0568a4edd8'::uuid,
  generate_series(2, 14),
  'not_shipped'::shipment_status_individual
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_shipments 
  WHERE order_id = '40cefd3c-29bc-4d33-92ba-ec0568a4edd8' 
  AND place_number > 1
);