-- Create RPC function to get products with notification issues
-- Products that are active, have last_notification_sent_at set, but no successful telegram logs
CREATE OR REPLACE FUNCTION public.get_products_with_notification_issues(
  p_limit INTEGER DEFAULT 12,
  p_offset INTEGER DEFAULT 0,
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'all',
  p_seller_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  brand TEXT,
  model TEXT,
  description TEXT,
  price NUMERIC,
  condition TEXT,
  seller_id UUID,
  seller_name TEXT,
  status product_status,
  lot_number INTEGER,
  place_number INTEGER,
  delivery_price NUMERIC,
  rating_seller NUMERIC,
  view_count INTEGER,
  last_notification_sent_at TIMESTAMPTZ,
  admin_notification_sent_at TIMESTAMPTZ,
  tg_notify_status TEXT,
  tg_notify_error TEXT,
  tg_notify_attempts INTEGER,
  tg_views_frozen INTEGER,
  catalog_position TIMESTAMPTZ,
  location TEXT,
  telegram_url TEXT,
  phone_url TEXT,
  product_url TEXT,
  optid_created TEXT,
  product_location TEXT,
  preview_image_url TEXT,
  cloudinary_public_id TEXT,
  cloudinary_url TEXT,
  ai_original_title TEXT,
  ai_suggested_title TEXT,
  ai_suggested_brand TEXT,
  ai_suggested_model TEXT,
  ai_confidence NUMERIC,
  ai_enriched_at TIMESTAMPTZ,
  requires_moderation BOOLEAN,
  ai_suggested_delivery_prices JSONB,
  ai_delivery_confidence NUMERIC,
  ai_delivery_reasoning JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
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
      SELECT 1 FROM public.telegram_notifications_log tnl
      WHERE tnl.related_entity_id = p.id
        AND tnl.status = 'sent'
        AND tnl.notification_type IN ('product_published', 'status_change')
    )
    AND (p_search IS NULL OR p_search = '' OR (
      p.title ILIKE '%' || p_search || '%' OR
      p.brand ILIKE '%' || p_search || '%' OR
      p.model ILIKE '%' || p_search || '%' OR
      p.description ILIKE '%' || p_search || '%' OR
      p.seller_name ILIKE '%' || p_search || '%'
    ))
    AND (p_status = 'all' OR p.status::text = p_status)
    AND (p_seller_id IS NULL OR p.seller_id = p_seller_id)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;