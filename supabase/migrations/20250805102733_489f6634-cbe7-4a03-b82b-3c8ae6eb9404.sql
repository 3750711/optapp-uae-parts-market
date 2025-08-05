-- Fix the unique constraint on order_images table to allow multiple non-primary images
-- while still ensuring only one primary image per order

-- Drop the existing problematic constraint
ALTER TABLE public.order_images DROP CONSTRAINT IF EXISTS unique_primary_image;

-- Create a partial unique constraint that only applies to primary images
-- This allows multiple is_primary = false records for the same order_id
-- but ensures only one is_primary = true record per order_id
CREATE UNIQUE INDEX unique_primary_image_per_order 
ON public.order_images (order_id) 
WHERE is_primary = true;

-- Add a comment to explain the constraint
COMMENT ON INDEX unique_primary_image_per_order IS 'Ensures only one primary image per order while allowing multiple non-primary images';