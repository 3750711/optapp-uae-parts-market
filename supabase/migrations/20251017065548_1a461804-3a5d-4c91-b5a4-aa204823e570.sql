-- Drop existing function first
DROP FUNCTION IF EXISTS public.get_seller_daily_statistics(date, date);

-- Create updated function with delivery cost
CREATE OR REPLACE FUNCTION public.get_seller_daily_statistics(
  start_date date,
  end_date date
)
RETURNS TABLE (
  seller_id uuid,
  seller_name text,
  seller_opt_id text,
  products_created bigint,
  orders_created bigint,
  total_revenue numeric,
  total_delivery_cost numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH seller_products AS (
    SELECT 
      p.seller_id,
      p.seller_name,
      pr.opt_id as seller_opt_id,
      COUNT(DISTINCT p.id) as products_created
    FROM public.products p
    LEFT JOIN public.profiles pr ON p.seller_id = pr.id
    WHERE p.created_at::date BETWEEN start_date AND end_date
    GROUP BY p.seller_id, p.seller_name, pr.opt_id
  ),
  seller_orders AS (
    SELECT 
      o.seller_id,
      COUNT(DISTINCT o.id) as orders_created,
      SUM(o.price * o.quantity) as total_revenue,
      SUM(COALESCE(o.delivery_price_confirm, 0)) as total_delivery_cost
    FROM public.orders o
    WHERE o.created_at::date BETWEEN start_date AND end_date
    GROUP BY o.seller_id
  )
  SELECT 
    COALESCE(sp.seller_id, so.seller_id) as seller_id,
    sp.seller_name,
    sp.seller_opt_id,
    COALESCE(sp.products_created, 0) as products_created,
    COALESCE(so.orders_created, 0) as orders_created,
    COALESCE(so.total_revenue, 0) as total_revenue,
    COALESCE(so.total_delivery_cost, 0) as total_delivery_cost
  FROM seller_products sp
  FULL OUTER JOIN seller_orders so ON sp.seller_id = so.seller_id
  ORDER BY total_revenue DESC;
END;
$$;