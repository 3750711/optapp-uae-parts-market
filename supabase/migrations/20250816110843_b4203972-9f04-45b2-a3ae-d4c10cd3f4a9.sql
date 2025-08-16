-- Fix shipment status enum for order_shipments table
-- Step 1: Remove the default value temporarily
ALTER TABLE public.order_shipments ALTER COLUMN shipment_status DROP DEFAULT;

-- Step 2: Update the incorrect data
UPDATE public.order_shipments 
SET shipment_status = 'not_shipped' 
WHERE shipment_status = 'partially_shipped';

-- Step 3: Create a new enum without partially_shipped for individual shipments
CREATE TYPE shipment_status_individual AS ENUM ('not_shipped', 'in_transit');

-- Step 4: Update the order_shipments table to use the new enum
ALTER TABLE public.order_shipments 
ALTER COLUMN shipment_status TYPE shipment_status_individual 
USING shipment_status::text::shipment_status_individual;

-- Step 5: Set the new default
ALTER TABLE public.order_shipments ALTER COLUMN shipment_status SET DEFAULT 'not_shipped'::shipment_status_individual;