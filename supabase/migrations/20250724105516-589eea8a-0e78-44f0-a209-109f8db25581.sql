-- Fix the auto_approve_trusted_seller_products trigger logic
-- This trigger should only auto-approve products for trusted sellers when status is 'pending'

CREATE OR REPLACE FUNCTION public.auto_approve_trusted_seller_products()
RETURNS TRIGGER AS $$
DECLARE
  is_trusted BOOLEAN;
BEGIN
  -- Get the seller's trust status
  SELECT is_trusted_seller INTO is_trusted
  FROM profiles 
  WHERE id = NEW.seller_id;
  
  -- Only change status to 'active' if seller is trusted AND current status is 'pending'
  IF is_trusted = TRUE AND NEW.status = 'pending' THEN
    NEW.status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;