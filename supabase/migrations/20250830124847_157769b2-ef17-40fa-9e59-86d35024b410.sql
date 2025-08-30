-- Fix type mismatch in get_seller_daily_statistics function
CREATE OR REPLACE FUNCTION public.get_seller_daily_statistics(
  start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  seller_id uuid,
  seller_name text,
  seller_opt_id text,
  products_created integer,
  orders_created integer,
  total_revenue numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can access seller statistics';
  END IF;

  RETURN QUERY
  WITH seller_products AS (
    SELECT 
      p.seller_id,
      COUNT(*)::integer as products_created
    FROM public.products p
    WHERE p.created_at::date BETWEEN start_date AND end_date
    GROUP BY p.seller_id
  ),
  seller_orders AS (
    SELECT 
      o.seller_id,
      COUNT(*)::integer as orders_created,
      SUM(o.price) as total_revenue
    FROM public.orders o
    WHERE o.created_at::date BETWEEN start_date AND end_date
    GROUP BY o.seller_id
  )
  SELECT 
    COALESCE(sp.seller_id, so.seller_id) as seller_id,
    COALESCE(prof.full_name, 'Unknown Seller') as seller_name,
    prof.opt_id as seller_opt_id,
    COALESCE(sp.products_created, 0) as products_created,
    COALESCE(so.orders_created, 0) as orders_created,
    COALESCE(so.total_revenue, 0) as total_revenue
  FROM seller_products sp
  FULL OUTER JOIN seller_orders so ON sp.seller_id = so.seller_id
  LEFT JOIN public.profiles prof ON COALESCE(sp.seller_id, so.seller_id) = prof.id
  WHERE COALESCE(sp.products_created, 0) > 0 OR COALESCE(so.orders_created, 0) > 0
  ORDER BY total_revenue DESC, products_created DESC;
END;
$function$;