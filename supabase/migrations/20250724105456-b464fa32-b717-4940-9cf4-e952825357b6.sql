-- Update the auto_approve_trusted_seller_products trigger to not change status if already 'active'
-- This prevents conflicts with client-side logic for trusted sellers

CREATE OR REPLACE FUNCTION public.auto_approve_trusted_seller_products()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the seller's trust status
  SELECT is_trusted_seller INTO NEW.status
  FROM profiles 
  WHERE id = NEW.seller_id AND is_trusted_seller = TRUE;
  
  -- Only change status to 'active' if seller is trusted AND status is not already 'active'
  IF FOUND AND NEW.status != 'active' THEN
    NEW.status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;