
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can create orders" ON public.orders;

-- Enable RLS on orders table if not already enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Add policy for admins to manage all orders
CREATE POLICY "Admins can manage all orders" ON public.orders
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

-- Allow sellers to create orders
CREATE POLICY "Sellers can create orders" ON public.orders
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'seller')
  )
);

-- Allow users to view their own orders (as buyers or sellers)
CREATE POLICY "Users can view their own orders" ON public.orders
FOR SELECT USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);
