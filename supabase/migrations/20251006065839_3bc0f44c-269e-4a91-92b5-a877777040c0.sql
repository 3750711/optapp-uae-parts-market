-- Fix column name in get_products_with_notification_issues RPC function
CREATE OR REPLACE FUNCTION public.get_products_with_notification_issues(
  p_limit integer DEFAULT 12,
  p_offset integer DEFAULT 0,
  p_search text DEFAULT NULL,
  p_status text DEFAULT 'all',
  p_seller_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  title text,
  brand text,
  model text,
  description text,
  price numeric,
  condition text,
  seller_id uuid,
  seller_name text,
  status product_status,
  lot_number integer,
  place_number integer,
  delivery_price numeric,
  rating_seller numeric,
  view_count integer,
  last_notification_sent_at timestamp with time zone,
  admin_notification_sent_at timestamp with time zone,
  tg_notify_status text,
  tg_notify_error text,
  tg_notify_attempts integer,
  tg_views_frozen integer,
  catalog_position timestamp with time zone,
  location text,
  telegram_url text,
  phone_url text,
  product_url text,
  optid_created text,
  product_location text,
  preview_image_url text,
  cloudinary_public_id text,
  cloudinary_url text,
  ai_original_title text,
  ai_suggested_title text,
  ai_suggested_brand text,
  ai_suggested_model text,
  ai_confidence numeric,
  ai_enriched_at timestamp with time zone,
  requires_moderation boolean,
  ai_suggested_delivery_prices jsonb,
  ai_delivery_confidence numeric,
  ai_delivery_reasoning jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.title, p.brand, p.model, p.description, p.price, p.condition,
    p.seller_id, p.seller_name, p.status, p.lot_number, p.place_number,
    p.delivery_price, p.rating_seller, p.view_count, p.last_notification_sent_at,
    p.admin_notification_sent_at, p.tg_notify_status, p.tg_notify_error,
    p.tg_notify_attempts, p.tg_views_frozen, p.catalog_position, p.location,
    p.telegram_url, p.phone_url, p.product_url, p.optid_created, p.product_location,
    p.preview_image_url, p.cloudinary_public_id, p.cloudinary_url,
    p.ai_original_title, p.ai_suggested_title, p.ai_suggested_brand,
    p.ai_suggested_model, p.ai_confidence, p.ai_enriched_at,
    p.requires_moderation, p.ai_suggested_delivery_prices, p.ai_delivery_confidence,
    p.ai_delivery_reasoning, p.created_at, p.updated_at
  FROM public.products p
  WHERE p.status = 'active'
    AND p.last_notification_sent_at IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 
      FROM public.telegram_notifications_log tnl
      WHERE tnl.related_entity_id = p.id
        AND tnl.status = 'sent'
        AND tnl.notification_type IN ('product_published', 'status_change')
    )
    AND (p_search IS NULL OR (
      p.title ILIKE '%' || p_search || '%' OR
      p.brand ILIKE '%' || p_search || '%' OR
      p.model ILIKE '%' || p_search || '%' OR
      p.seller_name ILIKE '%' || p_search || '%'
    ))
    AND (p_status = 'all' OR p.status::text = p_status)
    AND (p_seller_id IS NULL OR p.seller_id = p_seller_id)
  ORDER BY p.catalog_position DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Fix column name in count_products_with_notification_issues RPC function
CREATE OR REPLACE FUNCTION public.count_products_with_notification_issues(
  p_search text DEFAULT NULL,
  p_status text DEFAULT 'all',
  p_seller_id uuid DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_count bigint;
BEGIN
  SELECT COUNT(*)
  INTO total_count
  FROM public.products p
  WHERE p.status = 'active'
    AND p.last_notification_sent_at IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 
      FROM public.telegram_notifications_log tnl
      WHERE tnl.related_entity_id = p.id
        AND tnl.status = 'sent'
        AND tnl.notification_type IN ('product_published', 'status_change')
    )
    AND (p_search IS NULL OR (
      p.title ILIKE '%' || p_search || '%' OR
      p.brand ILIKE '%' || p_search || '%' OR
      p.model ILIKE '%' || p_search || '%' OR
      p.seller_name ILIKE '%' || p_search || '%'
    ))
    AND (p_status = 'all' OR p.status::text = p_status)
    AND (p_seller_id IS NULL OR p.seller_id = p_seller_id);
    
  RETURN total_count;
END;
$$;