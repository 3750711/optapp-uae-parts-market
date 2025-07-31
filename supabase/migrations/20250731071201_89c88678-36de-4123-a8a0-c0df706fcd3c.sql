-- Drop the existing constraint that prevents multiple offers
DROP INDEX IF EXISTS unique_pending_offer_per_buyer_product_idx;

-- Create a new constraint that only prevents multiple PENDING offers
-- This allows multiple rejected/expired/cancelled offers but only one pending
CREATE UNIQUE INDEX unique_pending_offer_per_buyer_product_new_idx 
ON public.price_offers (buyer_id, product_id) 
WHERE status = 'pending';