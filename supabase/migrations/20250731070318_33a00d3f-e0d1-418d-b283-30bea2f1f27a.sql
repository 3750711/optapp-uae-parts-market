-- Drop the problematic constraint and create a better one
ALTER TABLE public.price_offers 
DROP CONSTRAINT IF EXISTS unique_pending_offer_per_buyer_product;

-- Add a partial unique constraint that only applies to pending offers
CREATE UNIQUE INDEX unique_pending_offer_per_buyer_product_idx 
ON public.price_offers (buyer_id, product_id) 
WHERE status = 'pending';