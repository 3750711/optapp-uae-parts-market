
-- Создаем функцию для получения максимального предложения по продукту (исключая текущего пользователя)
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
  max_price numeric := 0;
  current_user_price numeric := 0;
  offers_count integer := 0;
  is_max boolean := false;
BEGIN
  -- Получаем максимальную цену предложения (исключая текущего пользователя)
  SELECT COALESCE(MAX(offered_price), 0) INTO max_price
  FROM price_offers 
  WHERE product_id = p_product_id 
    AND status = 'pending'
    AND (p_exclude_user_id IS NULL OR buyer_id != p_exclude_user_id);
  
  -- Получаем предложение текущего пользователя (если есть)
  IF p_exclude_user_id IS NOT NULL THEN
    SELECT COALESCE(offered_price, 0) INTO current_user_price
    FROM price_offers 
    WHERE product_id = p_product_id 
      AND buyer_id = p_exclude_user_id 
      AND status = 'pending'
    LIMIT 1;
    
    -- Проверяем, является ли предложение текущего пользователя максимальным
    SELECT COALESCE(MAX(offered_price), 0) INTO max_price
    FROM price_offers 
    WHERE product_id = p_product_id 
      AND status = 'pending';
    
    is_max := (current_user_price > 0 AND current_user_price >= max_price);
    
    -- Если у текущего пользователя максимальное предложение, 
    -- то показываем второе по величине как конкурентное
    IF is_max THEN
      SELECT COALESCE(MAX(offered_price), 0) INTO max_price
      FROM price_offers 
      WHERE product_id = p_product_id 
        AND status = 'pending'
        AND buyer_id != p_exclude_user_id;
    END IF;
  END IF;
  
  -- Подсчитываем общее количество активных предложений
  SELECT COUNT(*) INTO offers_count
  FROM price_offers 
  WHERE product_id = p_product_id 
    AND status = 'pending';
  
  RETURN QUERY SELECT max_price, is_max, offers_count, current_user_price;
END;
$$;
