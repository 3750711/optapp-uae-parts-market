
-- Create a new migration to fix Row-Level Security on the profiles table.
-- First, drop all existing SELECT policies on the profiles table to prevent conflicts and infinite recursion.
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users view own and public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profile access" ON public.profiles;
DROP POLICY IF EXISTS "Sellers can view buyer profiles for orders" ON public.profiles;
DROP POLICY IF EXISTS "Public view buyer basic info" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow full access for admins and self-access for users" ON public.profiles;

-- Create a single, authoritative SELECT policy for the profiles table.
-- This policy grants unconditional read access to administrators via the is_admin_user() function,
-- while allowing non-admin users to see only their own profile.
CREATE POLICY "Admin full access, user self-access" ON public.profiles
FOR SELECT
USING (
  public.is_admin_user() OR (id = auth.uid())
);
