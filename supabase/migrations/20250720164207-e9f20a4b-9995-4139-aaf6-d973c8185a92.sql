
-- Create the missing get_competitive_offer_data function that matches the existing get_max_offer_for_product functionality
CREATE OR REPLACE FUNCTION get_competitive_offer_data(
  p_product_id uuid, 
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  max_offer_price numeric,
  current_user_is_max boolean,
  total_offers_count integer,
  current_user_offer_price numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_record RECORD;
BEGIN
  -- Use the same logic as get_max_offer_for_product but with different parameter names
  SELECT 
    COALESCE(MAX(CASE WHEN buyer_id != COALESCE(p_user_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN offered_price END), 0) as max_other_price,
    COALESCE(MAX(CASE WHEN buyer_id = p_user_id THEN offered_price END), 0) as user_price,
    COUNT(*) as total_count,
    COALESCE(MAX(offered_price), 0) as absolute_max
  INTO result_record
  FROM price_offers 
  WHERE product_id = p_product_id 
    AND status = 'pending';
  
  -- Determine if user is leading
  DECLARE
    is_max boolean := false;
    final_max_price numeric := result_record.max_other_price;
  BEGIN
    IF p_user_id IS NOT NULL AND result_record.user_price > 0 THEN
      is_max := (result_record.user_price >= result_record.absolute_max);
      -- If user is leading, show second best offer
      IF is_max THEN
        final_max_price := result_record.max_other_price;
      END IF;
    END IF;
    
    RETURN QUERY SELECT 
      final_max_price,
      is_max,
      result_record.total_count::integer,
      result_record.user_price;
  END;
END;
$$;
