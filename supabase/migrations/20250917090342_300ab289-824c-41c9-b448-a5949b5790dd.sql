-- Create backup RPC function for OPT_ID checking
-- This works with SECURITY DEFINER to bypass RLS restrictions
CREATE OR REPLACE FUNCTION public.check_opt_id_exists(check_opt_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Simple existence check that bypasses RLS
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE opt_id = check_opt_id
    LIMIT 1
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_opt_id_exists(text) TO anon, authenticated;