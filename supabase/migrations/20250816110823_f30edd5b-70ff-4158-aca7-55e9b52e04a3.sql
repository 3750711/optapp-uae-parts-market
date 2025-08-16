-- Fix shipment status enum for order_shipments table
-- First, update the incorrect data
UPDATE public.order_shipments 
SET shipment_status = 'not_shipped' 
WHERE shipment_status = 'partially_shipped';

-- Create a new enum without partially_shipped for individual shipments
CREATE TYPE shipment_status_individual AS ENUM ('not_shipped', 'in_transit');

-- Update the order_shipments table to use the new enum
ALTER TABLE public.order_shipments 
ALTER COLUMN shipment_status TYPE shipment_status_individual 
USING shipment_status::text::shipment_status_individual;

-- Keep the original shipment_status enum for orders table (it still needs partially_shipped)
-- The orders.shipment_status will be calculated based on individual order_shipments statuses