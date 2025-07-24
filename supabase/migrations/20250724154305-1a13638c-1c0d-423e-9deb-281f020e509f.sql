-- Fix 400 error by simplifying RLS policies to avoid complex joins
-- Drop existing policies that cause conflicts
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

-- Create simplified RLS policies that don't rely on complex profile joins
-- Use direct auth checks to avoid circular dependencies

-- Admins have full access using simplified check
CREATE POLICY "Orders admin access" ON public.orders
FOR ALL USING (
  auth.jwt() ->> 'user_metadata' ->> 'user_type' = 'admin'
);

-- Users can view their own orders as buyer or seller
CREATE POLICY "Orders user view" ON public.orders
FOR SELECT USING (
  auth.uid() = buyer_id OR 
  auth.uid() = seller_id OR
  auth.jwt() ->> 'user_metadata' ->> 'user_type' = 'admin'
);

-- Users can update their own orders
CREATE POLICY "Orders user update" ON public.orders
FOR UPDATE USING (
  auth.uid() = buyer_id OR 
  auth.uid() = seller_id OR
  auth.jwt() ->> 'user_metadata' ->> 'user_type' = 'admin'
);

-- Sellers and admins can create orders
CREATE POLICY "Orders create" ON public.orders
FOR INSERT WITH CHECK (
  auth.jwt() ->> 'user_metadata' ->> 'user_type' IN ('admin', 'seller') OR
  auth.uid() = buyer_id
);