-- Create public RLS policies for statistics access

-- Allow public access to count products (active and sold only)
CREATE POLICY "Public can count products" ON public.products
FOR SELECT USING (
  -- Only allow counting active/sold products for statistics
  status IN ('active', 'sold') AND
  -- Only allow SELECT with count operation (head: true)
  current_setting('request.method', true) = 'HEAD'
);

-- Allow public access to count sellers
CREATE POLICY "Public can count sellers" ON public.profiles  
FOR SELECT USING (
  -- Only allow counting verified sellers
  user_type = 'seller' AND
  verification_status = 'verified' AND
  -- Only allow SELECT with count operation (head: true)  
  current_setting('request.method', true) = 'HEAD'
);

-- Allow public access to get max order number
CREATE POLICY "Public can get max order number" ON public.orders
FOR SELECT USING (
  -- Allow reading order_number column only for getting max value
  current_setting('request.method', true) = 'GET'
);

-- Create security definer function for public statistics
CREATE OR REPLACE FUNCTION public.get_public_statistics()
RETURNS jsonb 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_products_count integer := 0;
  total_sellers_count integer := 0;
  max_order_number integer := 0;
BEGIN
  -- Count active/sold products
  SELECT COUNT(*)::integer INTO total_products_count
  FROM products 
  WHERE status IN ('active', 'sold');
  
  -- Count verified sellers
  SELECT COUNT(*)::integer INTO total_sellers_count  
  FROM profiles
  WHERE user_type = 'seller' 
  AND verification_status = 'verified';
  
  -- Get max order number
  SELECT COALESCE(MAX(order_number), 0)::integer INTO max_order_number
  FROM orders;
  
  RETURN jsonb_build_object(
    'totalProducts', total_products_count,
    'totalSellers', total_sellers_count,
    'lastOrderNumber', max_order_number
  );
END;
$$;