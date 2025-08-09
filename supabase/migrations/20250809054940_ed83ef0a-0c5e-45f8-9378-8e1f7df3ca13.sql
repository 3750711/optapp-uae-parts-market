-- Add reviews_count to stores if missing
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS reviews_count integer NOT NULL DEFAULT 0;

-- Function to update store rating and reviews_count on review changes
CREATE OR REPLACE FUNCTION public.update_store_rating_and_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.stores
  SET 
    rating = COALESCE(ROUND((SELECT AVG(rating)::numeric(10,2) FROM public.store_reviews WHERE store_id = COALESCE(NEW.store_id, OLD.store_id)), 2), 0),
    reviews_count = (SELECT COUNT(*) FROM public.store_reviews WHERE store_id = COALESCE(NEW.store_id, OLD.store_id))
  WHERE id = COALESCE(NEW.store_id, OLD.store_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate triggers to keep data consistent
DROP TRIGGER IF EXISTS trg_store_reviews_rating_ins ON public.store_reviews;
DROP TRIGGER IF EXISTS trg_store_reviews_rating_upd ON public.store_reviews;
DROP TRIGGER IF EXISTS trg_store_reviews_rating_del ON public.store_reviews;

CREATE TRIGGER trg_store_reviews_rating_ins
AFTER INSERT ON public.store_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_store_rating_and_count();

CREATE TRIGGER trg_store_reviews_rating_upd
AFTER UPDATE ON public.store_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_store_rating_and_count();

CREATE TRIGGER trg_store_reviews_rating_del
AFTER DELETE ON public.store_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_store_rating_and_count();

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_products_seller_status ON public.products (seller_id, status);
CREATE INDEX IF NOT EXISTS idx_store_reviews_store_created ON public.store_reviews (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_images_store_primary ON public.store_images (store_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_store_car_brands_store ON public.store_car_brands (store_id);
-- store_car_models has no brand_id column; index (store_id, car_model_id) to optimize joins
CREATE INDEX IF NOT EXISTS idx_store_car_models_store_model ON public.store_car_models (store_id, car_model_id);