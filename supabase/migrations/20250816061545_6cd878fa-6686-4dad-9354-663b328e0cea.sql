-- Create shipment_status enum type
CREATE TYPE shipment_status AS ENUM ('not_shipped', 'partially_shipped', 'in_transit');

-- Add shipment_status field to orders table
ALTER TABLE public.orders 
ADD COLUMN shipment_status shipment_status DEFAULT 'not_shipped';