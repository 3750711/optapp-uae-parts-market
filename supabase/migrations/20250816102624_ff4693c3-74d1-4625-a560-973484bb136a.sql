-- Remove container_status from order_shipments as it's duplicated from containers table
-- We only need container_number to reference the containers table
ALTER TABLE public.order_shipments 
DROP COLUMN IF EXISTS container_status;