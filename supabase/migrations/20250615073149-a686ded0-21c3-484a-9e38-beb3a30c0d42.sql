
-- This migration fixes the is_admin function to prevent infinite recursion in RLS policies.
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public -- Explicitly set search_path to break potential recursion
AS $function$
BEGIN
  -- This check is now safe to use in RLS policies on the profiles table
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND user_type = 'admin'::user_type
  );
END;
$function$
