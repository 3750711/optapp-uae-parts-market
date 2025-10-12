-- ============================================================
-- STEP 1 & 2: Recreate VIEWs with proper field filtering
-- and assign access permissions
-- ============================================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS public.products_public CASCADE;
DROP VIEW IF EXISTS public.products_for_buyers CASCADE;

-- ============================================================
-- STEP 1.1: Create products_public (for anonymous and sellers)
-- EXCLUDES: price, delivery_price, seller_name, telegram_url, phone_url
-- ============================================================

CREATE VIEW public.products_public AS
SELECT 
    p.id,
    p.title,
    p.brand,
    p.model,
    p.condition,
    p.description,
    p.lot_number,
    p.place_number,
    p.product_location,
    p.location,
    p.preview_image_url,
    p.view_count,
    p.tg_views_frozen,
    p.rating_seller,
    p.status,
    p.seller_id,
    p.cloudinary_url,
    p.cloudinary_public_id,
    p.created_at,
    p.updated_at,
    p.catalog_position,
    -- Subquery for product images (JSON aggregation)
    (SELECT json_agg(json_build_object(
        'id', pi.id, 
        'url', pi.url, 
        'is_primary', pi.is_primary, 
        'product_id', pi.product_id
    ) ORDER BY pi.is_primary DESC NULLS LAST, pi.created_at)
     FROM product_images pi
     WHERE pi.product_id = p.id) AS product_images
FROM products p
WHERE p.status = 'active';

-- ============================================================
-- STEP 1.2: Create products_for_buyers (for buyers only)
-- INCLUDES: all fields from products_public PLUS price, delivery_price, 
--           seller_name, telegram_url, phone_url
-- ============================================================

CREATE VIEW public.products_for_buyers AS
SELECT 
    p.id,
    p.title,
    p.brand,
    p.model,
    p.condition,
    p.description,
    p.lot_number,
    p.place_number,
    p.product_location,
    p.location,
    p.preview_image_url,
    p.view_count,
    p.tg_views_frozen,
    p.rating_seller,
    p.status,
    p.seller_id,
    p.cloudinary_url,
    p.cloudinary_public_id,
    p.created_at,
    p.updated_at,
    p.catalog_position,
    -- ✅ ADDITIONAL FIELDS FOR BUYERS:
    p.price,
    p.delivery_price,
    p.seller_name,
    p.telegram_url,
    p.phone_url,
    -- Subquery for product images (JSON aggregation)
    (SELECT json_agg(json_build_object(
        'id', pi.id, 
        'url', pi.url, 
        'is_primary', pi.is_primary, 
        'product_id', pi.product_id
    ) ORDER BY pi.is_primary DESC NULLS LAST, pi.created_at)
     FROM product_images pi
     WHERE pi.product_id = p.id) AS product_images
FROM products p
WHERE p.status = 'active';

-- ============================================================
-- STEP 2: Assign access permissions
-- ============================================================

-- products_public: accessible by anon and authenticated
GRANT SELECT ON public.products_public TO anon;
GRANT SELECT ON public.products_public TO authenticated;

-- products_for_buyers: accessible ONLY by authenticated users
GRANT SELECT ON public.products_for_buyers TO authenticated;

-- Ensure anon cannot access products_for_buyers
REVOKE ALL ON public.products_for_buyers FROM anon;

-- Add comments for documentation
COMMENT ON VIEW public.products_public IS 
'Public view of products for anonymous users and sellers. Excludes sensitive fields: price, delivery_price, seller_name, telegram_url, phone_url';

COMMENT ON VIEW public.products_for_buyers IS 
'Full view of products for authenticated buyers. Includes all fields including price, delivery_price, seller_name, and contact information';