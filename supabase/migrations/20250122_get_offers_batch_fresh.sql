
CREATE OR REPLACE FUNCTION public.get_offers_batch_fresh(
  p_product_ids UUID[],
  p_user_id UUID
)
RETURNS TABLE(
  product_id UUID,
  max_offer_price NUMERIC,
  total_offers INTEGER,
  current_user_is_max BOOLEAN,
  current_user_offer_price NUMERIC,
  current_user_offer_status TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set transaction isolation to read uncommitted for freshest data
  SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
  
  RETURN QUERY
  WITH offer_stats AS (
    SELECT 
      po.product_id,
      MAX(po.offered_price) as max_price,
      COUNT(*) as offer_count,
      MAX(CASE WHEN po.buyer_id = p_user_id THEN po.offered_price END) as user_offer_price,
      MAX(CASE WHEN po.buyer_id = p_user_id THEN po.status END) as user_offer_status,
      MAX(CASE WHEN po.buyer_id = p_user_id THEN po.expires_at END) as user_expires_at
    FROM price_offers po
    WHERE po.product_id = ANY(p_product_ids)
      AND po.status = 'pending'
    GROUP BY po.product_id
  )
  SELECT 
    os.product_id,
    COALESCE(os.max_price, 0) as max_offer_price,
    COALESCE(os.offer_count, 0)::INTEGER as total_offers,
    CASE 
      WHEN os.user_offer_price IS NOT NULL AND os.user_offer_price = os.max_price 
      THEN true 
      ELSE false 
    END as current_user_is_max,
    COALESCE(os.user_offer_price, 0) as current_user_offer_price,
    COALESCE(os.user_offer_status, 'none') as current_user_offer_status,
    os.user_expires_at as expires_at
  FROM offer_stats os;
END;
$$;
