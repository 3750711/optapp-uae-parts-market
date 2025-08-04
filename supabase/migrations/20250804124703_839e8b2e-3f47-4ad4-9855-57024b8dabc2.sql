-- Remove the conflicting simple check_opt_id_exists function to resolve overloading issue
DROP FUNCTION IF EXISTS public.check_opt_id_exists(text);

-- Keep only the rate-limited version with proper parameters
-- The function with (p_opt_id text, p_ip_address inet) will remain as the only version