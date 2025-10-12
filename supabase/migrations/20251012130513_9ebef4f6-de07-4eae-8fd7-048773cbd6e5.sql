-- Drop and recreate views to add tg_views_frozen column
DROP VIEW IF EXISTS public.products_for_buyers;
DROP VIEW IF EXISTS public.products_public;

-- Recreate products_for_buyers view with tg_views_frozen
CREATE VIEW public.products_for_buyers AS
SELECT 
  p.id,
  p.title,
  p.brand,
  p.model,
  p.condition,
  p.description,
  p.lot_number,
  p.product_location,
  p.preview_image_url,
  p.view_count,
  p.tg_views_frozen,
  p.rating_seller,
  p.status,
  p.place_number,
  p.delivery_price,
  p.price,
  p.seller_name,
  p.seller_id,
  p.location,
  p.telegram_url,
  p.phone_url,
  p.cloudinary_url,
  p.cloudinary_public_id,
  p.created_at,
  p.updated_at,
  p.catalog_position,
  (
    SELECT json_agg(
      json_build_object(
        'id', pi.id,
        'url', pi.url,
        'is_primary', pi.is_primary,
        'product_id', pi.product_id
      ) 
      ORDER BY pi.is_primary DESC NULLS LAST, pi.created_at
    )
    FROM product_images pi
    WHERE pi.product_id = p.id
  ) AS product_images
FROM products p
WHERE p.status = 'active'::product_status;

-- Recreate products_public view with tg_views_frozen
CREATE VIEW public.products_public AS
SELECT 
  p.id,
  p.title,
  p.brand,
  p.model,
  p.condition,
  p.description,
  p.lot_number,
  p.product_location,
  p.preview_image_url,
  p.view_count,
  p.tg_views_frozen,
  p.rating_seller,
  p.status,
  p.place_number,
  p.seller_id,
  p.location,
  p.cloudinary_url,
  p.cloudinary_public_id,
  p.created_at,
  p.updated_at,
  p.catalog_position,
  (
    SELECT json_agg(
      json_build_object(
        'id', pi.id,
        'url', pi.url,
        'is_primary', pi.is_primary,
        'product_id', pi.product_id
      ) 
      ORDER BY pi.is_primary DESC NULLS LAST, pi.created_at
    )
    FROM product_images pi
    WHERE pi.product_id = p.id
  ) AS product_images
FROM products p
WHERE p.status = 'active'::product_status;