-- Drop and recreate products_public view with product images
DROP VIEW IF EXISTS public.products_public;

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
    -- Add product_images array with aggregation
    (SELECT json_agg(
        json_build_object(
            'id', pi.id,
            'url', pi.url,
            'is_primary', pi.is_primary,
            'product_id', pi.product_id
        )
        ORDER BY pi.is_primary DESC NULLS LAST, pi.created_at ASC
    )
    FROM product_images pi
    WHERE pi.product_id = p.id
    ) as product_images
FROM public.products p
WHERE p.status = 'active';