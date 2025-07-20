
-- Fix the get_competitive_offer_data function to properly show second highest bid for leading offers
CREATE OR REPLACE FUNCTION public.get_competitive_offer_data(p_product_id uuid, p_user_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(
  max_offer_price numeric,
  current_user_is_max boolean,
  total_offers_count integer,
  current_user_offer_price numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result_record RECORD;
  second_best_offer numeric := 0;
BEGIN
  -- Get basic offer statistics
  SELECT 
    COALESCE(MAX(offered_price), 0) as absolute_max,
    COUNT(*) as total_count,
    COALESCE(MAX(CASE WHEN buyer_id = p_user_id THEN offered_price END), 0) as user_price
  INTO result_record
  FROM price_offers 
  WHERE product_id = p_product_id 
    AND status = 'pending';
  
  -- Calculate second best offer (highest offer that's not from the current user)
  SELECT COALESCE(MAX(offered_price), 0)
  INTO second_best_offer
  FROM price_offers 
  WHERE product_id = p_product_id 
    AND status = 'pending'
    AND buyer_id != COALESCE(p_user_id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- Determine if user is leading and what price to show
  DECLARE
    is_max boolean := false;
    display_price numeric := second_best_offer;
  BEGIN
    IF p_user_id IS NOT NULL AND result_record.user_price > 0 THEN
      is_max := (result_record.user_price >= result_record.absolute_max);
      -- If user is leading, show second best offer
      -- If user is not leading or has no offer, show the best competing offer
      IF is_max THEN
        display_price := second_best_offer;
      ELSE
        display_price := result_record.absolute_max;
      END IF;
    ELSE
      -- No user provided or user has no offer, show highest offer
      display_price := result_record.absolute_max;
    END IF;
    
    RETURN QUERY SELECT 
      display_price,
      is_max,
      result_record.total_count::integer,
      result_record.user_price;
  END;
END;
$function$;

-- Update the batch function to use the same corrected logic
CREATE OR REPLACE FUNCTION get_offers_batch(
  p_product_ids uuid[],
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  product_id uuid,
  max_offer_price numeric,
  current_user_is_max boolean,
  total_offers_count integer,
  current_user_offer_price numeric,
  has_pending_offer boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH offer_stats AS (
    SELECT 
      po.product_id,
      COALESCE(MAX(po.offered_price), 0) as absolute_max,
      COUNT(*) as total_count,
      COALESCE(MAX(CASE WHEN po.buyer_id = p_user_id THEN po.offered_price END), 0) as user_price,
      COALESCE(MAX(CASE WHEN po.buyer_id != COALESCE(p_user_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN po.offered_price END), 0) as second_best_offer,
      COUNT(CASE WHEN po.buyer_id = p_user_id THEN 1 END) > 0 as has_user_offer
    FROM price_offers po
    WHERE po.product_id = ANY(p_product_ids)
      AND po.status = 'pending'
    GROUP BY po.product_id
  ),
  all_products AS (
    SELECT unnest(p_product_ids) as product_id
  )
  SELECT 
    ap.product_id,
    CASE 
      WHEN p_user_id IS NOT NULL AND os.user_price > 0 AND os.user_price >= os.absolute_max 
      THEN os.second_best_offer  -- User is leading, show second best
      WHEN p_user_id IS NOT NULL AND os.user_price > 0 AND os.user_price < os.absolute_max
      THEN os.absolute_max       -- User is not leading, show best competing offer
      ELSE COALESCE(os.absolute_max, 0)  -- No user offer, show best offer
    END as max_offer_price,
    CASE 
      WHEN p_user_id IS NOT NULL AND os.user_price > 0 
      THEN (os.user_price >= os.absolute_max)
      ELSE false
    END as current_user_is_max,
    COALESCE(os.total_count, 0)::integer as total_offers_count,
    COALESCE(os.user_price, 0) as current_user_offer_price,
    COALESCE(os.has_user_offer, false) as has_pending_offer
  FROM all_products ap
  LEFT JOIN offer_stats os ON ap.product_id = os.product_id
  ORDER BY ap.product_id;
END;
$$;
