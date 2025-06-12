
-- Сначала создаем RPC функцию для получения админ метрик
CREATE OR REPLACE FUNCTION get_admin_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'pending_users', (SELECT COUNT(*) FROM profiles WHERE verification_status = 'pending'),
    'total_products', (SELECT COUNT(*) FROM products),
    'pending_products', (SELECT COUNT(*) FROM products WHERE status = 'pending'),
    'total_orders', (SELECT COUNT(*) FROM orders),
    'non_processed_orders', (SELECT COUNT(*) FROM orders WHERE status != 'processed')
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Добавляем права доступа только для аутентифицированных пользователей
REVOKE ALL ON FUNCTION get_admin_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_admin_metrics() TO authenticated;

-- Создаем RPC функцию для получения данных для добавления продуктов
CREATE OR REPLACE FUNCTION get_admin_add_product_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  brands_data JSON;
  models_data JSON;
  sellers_data JSON;
BEGIN
  -- Проверяем, что пользователь является администратором
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can access this function';
  END IF;

  -- Получаем все бренды автомобилей
  SELECT json_agg(
    json_build_object(
      'id', id,
      'name', name
    ) ORDER BY name
  ) INTO brands_data
  FROM car_brands;

  -- Получаем все модели автомобилей
  SELECT json_agg(
    json_build_object(
      'id', id,
      'brand_id', brand_id,
      'name', name
    ) ORDER BY name
  ) INTO models_data
  FROM car_models;

  -- Получаем всех продавцов с OPT ID
  SELECT json_agg(
    json_build_object(
      'id', id,
      'full_name', full_name,
      'opt_id', opt_id
    ) ORDER BY full_name
  ) INTO sellers_data
  FROM profiles
  WHERE user_type = 'seller'
  AND opt_id IS NOT NULL;

  -- Объединяем все данные в один JSON объект
  SELECT json_build_object(
    'brands', COALESCE(brands_data, '[]'::json),
    'models', COALESCE(models_data, '[]'::json),
    'sellers', COALESCE(sellers_data, '[]'::json),
    'timestamp', EXTRACT(EPOCH FROM NOW())
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Добавляем права доступа только для аутентифицированных пользователей
REVOKE ALL ON FUNCTION get_admin_add_product_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_admin_add_product_data() TO authenticated;
