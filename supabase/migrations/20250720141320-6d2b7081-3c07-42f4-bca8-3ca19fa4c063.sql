
-- Оптимизация функции get_max_offer_for_product для лучшей производительности
CREATE OR REPLACE FUNCTION get_max_offer_for_product(
  p_product_id uuid, 
  p_exclude_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  max_offer_price numeric,
  current_user_is_max boolean,
  total_offers_count integer,
  current_user_offer_price numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_record RECORD;
BEGIN
  -- Единый оптимизированный запрос вместо множественных SELECT-ов
  SELECT 
    COALESCE(MAX(CASE WHEN buyer_id != COALESCE(p_exclude_user_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN offered_price END), 0) as max_other_price,
    COALESCE(MAX(CASE WHEN buyer_id = p_exclude_user_id THEN offered_price END), 0) as user_price,
    COUNT(*) as total_count,
    COALESCE(MAX(offered_price), 0) as absolute_max
  INTO result_record
  FROM price_offers 
  WHERE product_id = p_product_id 
    AND status = 'pending';
  
  -- Определяем, является ли пользователь лидером
  DECLARE
    is_max boolean := false;
    final_max_price numeric := result_record.max_other_price;
  BEGIN
    IF p_exclude_user_id IS NOT NULL AND result_record.user_price > 0 THEN
      is_max := (result_record.user_price >= result_record.absolute_max);
      -- Если пользователь лидирует, показываем второе лучшее предложение
      IF is_max THEN
        final_max_price := result_record.max_other_price;
      END IF;
    END IF;
    
    RETURN QUERY SELECT 
      final_max_price,
      is_max,
      result_record.total_count::integer,
      result_record.user_price;
  END;
END;
$$;

-- Создаем функцию для батчевого получения данных предложений
CREATE OR REPLACE FUNCTION get_offers_batch(
  p_product_ids uuid[],
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  product_id uuid,
  max_offer_price numeric,
  current_user_is_max boolean,
  total_offers_count integer,
  current_user_offer_price numeric,
  has_pending_offer boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH offer_stats AS (
    SELECT 
      po.product_id,
      COALESCE(MAX(CASE WHEN po.buyer_id != COALESCE(p_user_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN po.offered_price END), 0) as max_other_price,
      COALESCE(MAX(CASE WHEN po.buyer_id = p_user_id THEN po.offered_price END), 0) as user_price,
      COUNT(*) as total_count,
      COALESCE(MAX(po.offered_price), 0) as absolute_max,
      COUNT(CASE WHEN po.buyer_id = p_user_id THEN 1 END) > 0 as has_user_offer
    FROM price_offers po
    WHERE po.product_id = ANY(p_product_ids)
      AND po.status = 'pending'
    GROUP BY po.product_id
  ),
  all_products AS (
    SELECT unnest(p_product_ids) as product_id
  )
  SELECT 
    ap.product_id,
    CASE 
      WHEN os.user_price > 0 AND os.user_price >= os.absolute_max 
      THEN os.max_other_price
      ELSE COALESCE(os.max_other_price, 0)
    END as max_offer_price,
    CASE 
      WHEN p_user_id IS NOT NULL AND os.user_price > 0 
      THEN (os.user_price >= os.absolute_max)
      ELSE false
    END as current_user_is_max,
    COALESCE(os.total_count, 0)::integer as total_offers_count,
    COALESCE(os.user_price, 0) as current_user_offer_price,
    COALESCE(os.has_user_offer, false) as has_pending_offer
  FROM all_products ap
  LEFT JOIN offer_stats os ON ap.product_id = os.product_id
  ORDER BY ap.product_id;
END;
$$;

-- Добавляем составные индексы для оптимизации запросов предложений
CREATE INDEX IF NOT EXISTS idx_price_offers_product_status_buyer 
ON price_offers(product_id, status, buyer_id) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_price_offers_product_price 
ON price_offers(product_id, offered_price DESC) 
WHERE status = 'pending';

-- Оптимизируем настройки для real-time
ALTER TABLE price_offers REPLICA IDENTITY FULL;
