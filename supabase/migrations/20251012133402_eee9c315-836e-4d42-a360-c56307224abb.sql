-- Step 1: Drop existing views with CASCADE
DROP VIEW IF EXISTS public.products_public CASCADE;
DROP VIEW IF EXISTS public.products_for_buyers CASCADE;

-- Step 2: Create products_public (for anonymous and sellers)
-- EXCLUDES: price, delivery_price, seller_name, telegram_url, phone_url
CREATE VIEW public.products_public AS
SELECT 
  id,
  title,
  brand,
  model,
  description,
  condition,
  seller_id,
  status,
  lot_number,
  place_number,
  rating_seller,
  view_count,
  last_notification_sent_at,
  admin_notification_sent_at,
  tg_notify_status,
  tg_notify_error,
  tg_notify_attempts,
  tg_views_frozen,
  catalog_position,
  location,
  product_url,
  optid_created,
  product_location,
  preview_image_url,
  cloudinary_public_id,
  cloudinary_url,
  ai_original_title,
  ai_suggested_title,
  ai_suggested_brand,
  ai_suggested_model,
  ai_confidence,
  ai_enriched_at,
  requires_moderation,
  ai_suggested_delivery_prices,
  ai_delivery_confidence,
  ai_delivery_reasoning,
  created_at,
  updated_at,
  telegram_notification_status,
  telegram_message_id,
  telegram_confirmed_at,
  telegram_last_error
FROM public.products
WHERE status = 'active';

-- Step 3: Create products_for_buyers (for authenticated buyers only)
-- INCLUDES: all fields from products_public PLUS price, delivery_price, seller_name, telegram_url, phone_url
CREATE VIEW public.products_for_buyers AS
SELECT 
  p.*,
  pr.price,
  pr.delivery_price,
  pr.seller_name,
  pr.telegram_url,
  pr.phone_url
FROM public.products_public p
JOIN public.products pr ON p.id = pr.id;

-- Step 4: Assign access permissions
GRANT SELECT ON public.products_public TO anon;
GRANT SELECT ON public.products_public TO authenticated;
GRANT SELECT ON public.products_for_buyers TO authenticated;
REVOKE ALL ON public.products_for_buyers FROM anon;

-- Step 5: Drop dangerous RLS policies from products table
DROP POLICY IF EXISTS "Safe product access policy" ON public.products;
DROP POLICY IF EXISTS "Enable public access to products via profile token" ON public.products;
DROP POLICY IF EXISTS "Public can count products" ON public.products;

-- Step 6: Create performance indexes for views
CREATE INDEX IF NOT EXISTS idx_products_status_active ON public.products(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_products_catalog_position ON public.products(catalog_position DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_products_seller_id_active ON public.products(seller_id) WHERE status = 'active';

-- Add documentation comments
COMMENT ON VIEW public.products_public IS 'Public view of active products excluding sensitive fields (price, delivery_price, seller_name, telegram_url, phone_url). Accessible to anonymous and authenticated users.';
COMMENT ON VIEW public.products_for_buyers IS 'Full view of active products including all fields. Accessible only to authenticated buyers.';