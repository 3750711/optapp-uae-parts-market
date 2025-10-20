-- Удаляем старый VIEW если существует
DROP VIEW IF EXISTS public.products_public CASCADE;

-- ШАГ 1: Создаём VIEW с публичными данными (БЕЗ чувствительной информации)
CREATE VIEW public.products_public AS
SELECT 
  -- ✅ Безопасные поля (публично доступны)
  id, title, brand, model, condition, description, status,
  lot_number, place_number, view_count, product_location,
  created_at, updated_at, catalog_position,
  cloudinary_public_id, cloudinary_url, preview_image_url,
  ai_confidence, ai_enriched_at, requires_moderation,
  ai_original_title, ai_suggested_title, ai_suggested_brand, ai_suggested_model,
  
  -- ❌ Чувствительные поля заменены на NULL
  NULL::numeric as price,
  NULL::numeric as delivery_price,
  NULL::text as seller_name,
  NULL::uuid as seller_id,
  NULL::text as optid_created,
  NULL::numeric as rating_seller,
  NULL::text as telegram_url,
  NULL::text as phone_url
  
FROM public.products
WHERE status IN ('active', 'sold');

-- Разрешаем публичный доступ к VIEW
GRANT SELECT ON public.products_public TO anon, authenticated;

-- ШАГ 2: Удаляем старую политику если существует и создаём новую
DROP POLICY IF EXISTS "Anonymous users can view public products" ON public.products;

CREATE POLICY "Anonymous users can view public products"
ON public.products
FOR SELECT
TO anon
USING (
  status IN ('active', 'sold')
);