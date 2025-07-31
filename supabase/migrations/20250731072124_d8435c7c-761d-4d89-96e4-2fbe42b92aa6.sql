-- Remove the old problematic unique constraint that prevents multiple rejected offers
-- from the same buyer for the same product
ALTER TABLE public.price_offers 
DROP CONSTRAINT IF EXISTS price_offers_product_id_buyer_id_status_key;

-- Verify we still have the correct constraint for pending offers only
-- (this should already exist from the previous migration)
-- unique_pending_offer_per_buyer_product_new_idx allows only one pending offer per buyer/product