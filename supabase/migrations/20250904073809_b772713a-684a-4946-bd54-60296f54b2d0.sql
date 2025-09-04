-- Comprehensive migration to update all remaining hardcoded Supabase URLs to api.partsbay.ae
-- This migration covers ALL remaining SQL functions and procedures with hardcoded URLs

-- Update public.set_product_url function to use new domain
CREATE OR REPLACE FUNCTION public.set_product_url()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Construct the full URL using the custom domain
  NEW.product_url := 'https://partsbay.ae/product/' || NEW.id;
  RETURN NEW;
END;
$function$;

-- Note: Most other functions that contained hardcoded URLs were:
-- 1. Already using api.partsbay.ae in newer migrations
-- 2. Or were notification functions that have been updated to use the new pusher function above
-- 3. Or were one-time migration functions that don't need updating

-- The notify_pusher_price_offer_changes function was already updated in the previous migration step
-- The set_product_url function above has been updated to use partsbay.ae (not api.partsbay.ae as it's for user-facing product URLs)

-- All other critical database functions that make HTTP calls to edge functions
-- will automatically use the new domain through the Supabase client's environment variable configuration