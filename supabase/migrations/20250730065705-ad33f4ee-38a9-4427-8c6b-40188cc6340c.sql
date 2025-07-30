-- Fix seller_create_order function ambiguity issue

-- Drop the old version of seller_create_order function (15 parameters)
DROP FUNCTION IF EXISTS public.seller_create_order(
  p_title text, 
  p_price numeric, 
  p_place_number integer, 
  p_order_seller_name text, 
  p_buyer_id uuid, 
  p_brand text, 
  p_model text, 
  p_status order_status, 
  p_order_created_type order_created_type, 
  p_telegram_url_order text, 
  p_images text[], 
  p_product_id uuid, 
  p_delivery_method delivery_method, 
  p_text_order text, 
  p_delivery_price_confirm numeric
);