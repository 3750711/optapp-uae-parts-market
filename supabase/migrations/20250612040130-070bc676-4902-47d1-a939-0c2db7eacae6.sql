
-- Создаем RPC функцию для получения всех админ метрик одним запросом
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
