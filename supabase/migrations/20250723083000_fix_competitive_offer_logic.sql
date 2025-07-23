
-- Fix the get_competitive_offer_data function to return the correct max_offer_price
-- When user is leading, it should return the second highest offer (from other users)
-- When user is not leading, it should return the highest offer overall

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
  user_offer_price numeric := 0;
  max_overall_price numeric := 0;
  second_best_price numeric := 0;
  total_count integer := 0;
  is_user_leading boolean := false;
BEGIN
  -- Get user's offer price
  SELECT COALESCE(offered_price, 0) INTO user_offer_price
  FROM price_offers 
  WHERE product_id = p_product_id 
    AND buyer_id = p_user_id 
    AND status = 'pending'
  LIMIT 1;
  
  -- Get maximum offer price overall
  SELECT COALESCE(MAX(offered_price), 0) INTO max_overall_price
  FROM price_offers 
  WHERE product_id = p_product_id 
    AND status = 'pending';
  
  -- Get second highest offer (excluding user's offer)
  SELECT COALESCE(MAX(offered_price), 0) INTO second_best_price
  FROM price_offers 
  WHERE product_id = p_product_id 
    AND status = 'pending'
    AND buyer_id != COALESCE(p_user_id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- Count total offers
  SELECT COUNT(*) INTO total_count
  FROM price_offers 
  WHERE product_id = p_product_id 
    AND status = 'pending';
  
  -- Determine if user is leading
  is_user_leading := (user_offer_price > 0 AND user_offer_price >= max_overall_price);
  
  -- Return appropriate max_offer_price based on user's status
  RETURN QUERY SELECT 
    CASE 
      WHEN is_user_leading THEN second_best_price  -- User is leading, show second best
      ELSE max_overall_price  -- User is not leading or has no offer, show best overall
    END as max_offer_price,
    is_user_leading,
    total_count,
    user_offer_price;
END;
$function$;

-- Also update the batch function to use the same logic
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
      COALESCE(MAX(po.offered_price), 0) as max_overall_price,
      COUNT(*) as total_count,
      COALESCE(MAX(CASE WHEN po.buyer_id = p_user_id THEN po.offered_price END), 0) as user_price,
      COALESCE(MAX(CASE WHEN po.buyer_id != COALESCE(p_user_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN po.offered_price END), 0) as second_best_price,
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
      WHEN p_user_id IS NOT NULL 
           AND os.user_price > 0 
           AND os.user_price >= os.max_overall_price 
      THEN os.second_best_price  -- User is leading, show second best
      ELSE COALESCE(os.max_overall_price, 0)  -- User is not leading or has no offer, show best overall
    END as max_offer_price,
    CASE 
      WHEN p_user_id IS NOT NULL AND os.user_price > 0 
      THEN (os.user_price >= os.max_overall_price)
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
