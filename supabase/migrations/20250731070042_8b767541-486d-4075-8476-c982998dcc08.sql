-- Add unique constraint to prevent multiple pending offers from same buyer for same product
ALTER TABLE public.price_offers 
ADD CONSTRAINT unique_pending_offer_per_buyer_product 
UNIQUE (buyer_id, product_id, status) 
DEFERRABLE INITIALLY DEFERRED;