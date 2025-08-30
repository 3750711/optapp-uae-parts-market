CREATE OR REPLACE FUNCTION get_seller_daily_statistics(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
  date DATE,
  seller_id UUID,
  seller_name TEXT,
  opt_id TEXT,
  products_created INTEGER,
  orders_created INTEGER,
  total_order_value NUMERIC,
  avg_order_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH date_range AS (
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date AS date
  ),
  sellers AS (
    SELECT DISTINCT 
      p.id as seller_id,
      p.full_name as seller_name,
      p.opt_id
    FROM profiles p
    WHERE p.user_type = 'seller'
  ),
  product_stats AS (
    SELECT 
      pr.seller_id,
      pr.created_at::date as date,
      COUNT(*) as products_created
    FROM products pr
    WHERE pr.created_at::date >= p_start_date 
      AND pr.created_at::date <= p_end_date
    GROUP BY pr.seller_id, pr.created_at::date
  ),
  order_stats AS (
    SELECT 
      o.seller_id,
      o.created_at::date as date,
      COUNT(*) as orders_created,
      SUM(o.price) as total_order_value,
      AVG(o.price) as avg_order_value
    FROM orders o
    WHERE o.created_at::date >= p_start_date 
      AND o.created_at::date <= p_end_date
    GROUP BY o.seller_id, o.created_at::date
  )
  SELECT 
    dr.date,
    s.seller_id,
    s.seller_name,
    s.opt_id,
    COALESCE(ps.products_created, 0) as products_created,
    COALESCE(os.orders_created, 0) as orders_created,
    COALESCE(os.total_order_value, 0) as total_order_value,
    COALESCE(os.avg_order_value, 0) as avg_order_value
  FROM date_range dr
  CROSS JOIN sellers s
  LEFT JOIN product_stats ps ON ps.seller_id = s.seller_id AND ps.date = dr.date
  LEFT JOIN order_stats os ON os.seller_id = s.seller_id AND os.date = dr.date
  WHERE (ps.products_created > 0 OR os.orders_created > 0)
  ORDER BY dr.date DESC, s.seller_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;