
-- Remove auction-related RPC functions
DROP FUNCTION IF EXISTS public.get_competitive_offer_data(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_offers_batch(uuid[], uuid);
DROP FUNCTION IF EXISTS public.get_max_offer_for_product(uuid, uuid);

-- Remove auction-related indexes that are no longer needed
DROP INDEX IF EXISTS idx_price_offers_product_status_buyer_optimized;
DROP INDEX IF EXISTS idx_price_offers_product_max_price;
DROP INDEX IF EXISTS idx_price_offers_active_only;

-- Keep only basic indexes for price offers
CREATE INDEX IF NOT EXISTS idx_price_offers_buyer_product 
ON price_offers(buyer_id, product_id);

CREATE INDEX IF NOT EXISTS idx_price_offers_seller_status 
ON price_offers(seller_id, status);

CREATE INDEX IF NOT EXISTS idx_price_offers_product_status 
ON price_offers(product_id, status);

-- Remove auction-related fields from products table if they exist
ALTER TABLE public.products 
DROP COLUMN IF EXISTS has_active_offers,
DROP COLUMN IF EXISTS max_offer_price,
DROP COLUMN IF EXISTS offers_count;

-- Create simple function to check if user has pending offer for a product
CREATE OR REPLACE FUNCTION public.check_user_pending_offer(
  p_product_id uuid,
  p_user_id uuid
)
RETURNS TABLE(
  has_offer boolean,
  offer_price numeric,
  offer_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) > 0 as has_offer,
    COALESCE(MAX(offered_price), 0) as offer_price,
    COALESCE(MAX(id), NULL) as offer_id
  FROM price_offers 
  WHERE product_id = p_product_id 
    AND buyer_id = p_user_id 
    AND status = 'pending';
END;
$$;
