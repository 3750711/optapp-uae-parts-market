-- Add seller_name to products_for_buyers VIEW
CREATE OR REPLACE VIEW public.products_for_buyers AS
SELECT 
    id, title, brand, model, condition, description,
    lot_number, product_location, preview_image_url,
    view_count, rating_seller, status, place_number,
    created_at, updated_at, catalog_position, seller_id,
    price, delivery_price, seller_name
FROM public.products
WHERE status = 'active';

-- Ensure proper access rights
GRANT SELECT ON public.products_for_buyers TO authenticated;

COMMENT ON VIEW public.products_for_buyers IS 
'Authenticated products view - includes price, delivery_price, seller_name. For buyers only.';