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