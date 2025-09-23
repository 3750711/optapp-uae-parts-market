-- Step 1: Replace current_user_id() with auth.uid() in all RLS policies

-- 1. Update product_videos policies
DROP POLICY IF EXISTS "Sellers delete product videos" ON public.product_videos;
CREATE POLICY "Sellers delete product videos" ON public.product_videos
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_videos.product_id 
    AND (products.seller_id = auth.uid() OR is_current_user_admin())
  )
);

DROP POLICY IF EXISTS "Sellers insert product videos" ON public.product_videos;
CREATE POLICY "Sellers insert product videos" ON public.product_videos
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_videos.product_id 
    AND (products.seller_id = auth.uid() OR is_current_user_admin())
  )
);

-- Step 2: Drop the current_user_id() function since it's redundant
DROP FUNCTION IF EXISTS public.current_user_id() CASCADE;