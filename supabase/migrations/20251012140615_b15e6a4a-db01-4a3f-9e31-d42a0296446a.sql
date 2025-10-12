-- Enable public read access to product_images for active products
-- This allows anonymous users to see images on public seller profiles

CREATE POLICY "Public read access to product images"
ON public.product_images
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 
    FROM public.products p 
    WHERE p.id = product_images.product_id 
      AND p.status = 'active'
  )
);