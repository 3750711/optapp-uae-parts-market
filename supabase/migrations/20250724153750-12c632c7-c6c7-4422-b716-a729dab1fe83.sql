-- Fix RLS policies for orders table to resolve 400 errors
-- Remove duplicate and conflicting policies

-- Drop all existing order policies to clean up conflicts
DROP POLICY IF EXISTS "Admins can update all order fields" ON public.orders;
DROP POLICY IF EXISTS "Buyers can update limited order fields" ON public.orders;
DROP POLICY IF EXISTS "Only buyers and admins can create orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update their order fields" ON public.orders;
DROP POLICY IF EXISTS "Users can update related orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view related orders" ON public.orders;
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_full_access" ON public.orders;
DROP POLICY IF EXISTS "orders_user_access" ON public.orders;

-- Create clean, non-overlapping RLS policies
-- Admins have full access
CREATE POLICY "Admins can manage all orders" ON public.orders
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

-- Sellers can create orders
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

-- Allow users to update their own orders
CREATE POLICY "Users can update their own orders" ON public.orders
FOR UPDATE USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);