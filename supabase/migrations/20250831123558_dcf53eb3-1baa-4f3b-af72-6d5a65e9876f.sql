-- Fix admin metrics to exclude cancelled orders from non_processed_orders count
-- Only count orders that actually need processing: created, seller_confirmed, admin_confirmed

CREATE OR REPLACE FUNCTION public.get_admin_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'pending_users', (SELECT COUNT(*) FROM public.profiles WHERE verification_status = 'pending'),
    'total_products', (SELECT COUNT(*) FROM public.products),
    'pending_products', (SELECT COUNT(*) FROM public.products WHERE status = 'pending'),
    'total_orders', (SELECT COUNT(*) FROM public.orders),
    'non_processed_orders', (SELECT COUNT(*) FROM public.orders WHERE status NOT IN ('processed', 'cancelled', 'shipped', 'delivered'))
  ) INTO result;
  
  RETURN result;
END;
$function$;