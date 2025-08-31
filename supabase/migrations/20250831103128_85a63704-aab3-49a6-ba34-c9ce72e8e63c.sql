-- Step 1: Fix is_current_user_admin() function to check user_type = 'admin' instead of specific UUIDs
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $func$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  );
$func$;

-- Step 2: Add SET search_path = public to Security Definer functions that don't have it
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $func$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  );
$func$;

CREATE OR REPLACE FUNCTION public.is_current_user_seller()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $func$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'seller'
  );
$func$;

-- Step 3: Clean up ALL existing policies that use current_user_id() and problematic ones
-- confirm_images - drop ALL existing policies
DROP POLICY IF EXISTS "Only sellers and admins delete confirm images" ON public.confirm_images;
DROP POLICY IF EXISTS "Only sellers and admins insert confirm images" ON public.confirm_images;
DROP POLICY IF EXISTS "Only sellers and admins update confirm images" ON public.confirm_images;
DROP POLICY IF EXISTS "Only sellers and admins view confirm images" ON public.confirm_images;
DROP POLICY IF EXISTS "Sellers can manage confirm images" ON public.confirm_images;
DROP POLICY IF EXISTS "Users can view confirm images for their orders" ON public.confirm_images;
DROP POLICY IF EXISTS "confirm_images_select_policy" ON public.confirm_images;
DROP POLICY IF EXISTS "confirm_images_insert_policy" ON public.confirm_images;
DROP POLICY IF EXISTS "confirm_images_delete_policy" ON public.confirm_images;

-- order_images - drop ALL existing policies  
DROP POLICY IF EXISTS "Only sellers and admins can delete order images" ON public.order_images;
DROP POLICY IF EXISTS "Sellers and admins can update order images" ON public.order_images;
DROP POLICY IF EXISTS "Sellers can manage order images" ON public.order_images;
DROP POLICY IF EXISTS "Users delete order images" ON public.order_images;
DROP POLICY IF EXISTS "Users insert order images" ON public.order_images;
DROP POLICY IF EXISTS "Users update order images" ON public.order_images;
DROP POLICY IF EXISTS "Users view order images" ON public.order_images;
DROP POLICY IF EXISTS "Users can view order images" ON public.order_images;
DROP POLICY IF EXISTS "Users can insert order images" ON public.order_images;
DROP POLICY IF EXISTS "Users can update order images" ON public.order_images;
DROP POLICY IF EXISTS "Users can delete order images" ON public.order_images;

-- order_videos - drop ALL existing policies
DROP POLICY IF EXISTS "Only sellers and admins can delete order videos" ON public.order_videos;
DROP POLICY IF EXISTS "Sellers and admins can update order videos" ON public.order_videos;
DROP POLICY IF EXISTS "Sellers can manage order videos" ON public.order_videos;
DROP POLICY IF EXISTS "Users delete order videos" ON public.order_videos;
DROP POLICY IF EXISTS "Users insert order videos" ON public.order_videos;
DROP POLICY IF EXISTS "Users view order videos" ON public.order_videos;
DROP POLICY IF EXISTS "Users can view order videos" ON public.order_videos;
DROP POLICY IF EXISTS "Users can insert order videos" ON public.order_videos;
DROP POLICY IF EXISTS "Users can update order videos" ON public.order_videos;
DROP POLICY IF EXISTS "Users can delete order videos" ON public.order_videos;
DROP POLICY IF EXISTS "order_videos_admin_access" ON public.order_videos;
DROP POLICY IF EXISTS "order_videos_user_access" ON public.order_videos;

-- product_images - drop problematic policies
DROP POLICY IF EXISTS "Product owners can manage images" ON public.product_images;
DROP POLICY IF EXISTS "Sellers delete product images" ON public.product_images;
DROP POLICY IF EXISTS "Sellers insert product images" ON public.product_images;  
DROP POLICY IF EXISTS "Sellers update product images" ON public.product_images;
DROP POLICY IF EXISTS "Sellers manage product images" ON public.product_images;

-- products - drop problematic policies
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Sellers can manage own products" ON public.products;
DROP POLICY IF EXISTS "Users can create products for themselves" ON public.products;

-- profiles - drop problematic policies
DROP POLICY IF EXISTS "Safe profile view policy" ON public.profiles;
DROP POLICY IF EXISTS "Safe profile update policy" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;