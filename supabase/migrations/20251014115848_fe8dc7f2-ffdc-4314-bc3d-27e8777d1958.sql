-- Step 1: Create function to update seller listing count
CREATE OR REPLACE FUNCTION public.update_seller_listing_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_uuid uuid;
  active_count integer;
BEGIN
  -- Determine which seller_id to update
  IF TG_OP = 'DELETE' THEN
    seller_uuid := OLD.seller_id;
  ELSE
    seller_uuid := NEW.seller_id;
  END IF;
  
  -- Count active products for this seller
  SELECT COUNT(*) INTO active_count
  FROM public.products
  WHERE seller_id = seller_uuid 
  AND status = 'active';
  
  -- Update listing_count in profiles
  UPDATE public.profiles
  SET listing_count = active_count
  WHERE id = seller_uuid;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Step 2: Create trigger on products table
DROP TRIGGER IF EXISTS trigger_update_listing_count ON public.products;

CREATE TRIGGER trigger_update_listing_count
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_seller_listing_count();

-- Step 3: Recalculate all existing listing counts
UPDATE public.profiles p
SET listing_count = (
  SELECT COUNT(*)
  FROM public.products pr
  WHERE pr.seller_id = p.id 
  AND pr.status = 'active'
)
WHERE p.user_type = 'seller';

-- Step 4: Add index for performance
CREATE INDEX IF NOT EXISTS idx_products_seller_status 
ON public.products(seller_id, status);