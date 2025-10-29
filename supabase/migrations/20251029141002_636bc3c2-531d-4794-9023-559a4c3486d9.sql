-- Функция для фильтрации заказов по номерам контейнеров
CREATE OR REPLACE FUNCTION filter_orders_by_containers(
  container_numbers text[]
)
RETURNS TABLE (order_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT os.order_id
  FROM order_shipments os
  WHERE os.container_number = ANY(container_numbers);
END;
$$ LANGUAGE plpgsql STABLE;

-- Функция для фильтрации заказов по статусам контейнеров
CREATE OR REPLACE FUNCTION filter_orders_by_container_statuses(
  container_statuses text[]
)
RETURNS TABLE (order_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT os.order_id
  FROM order_shipments os
  INNER JOIN containers c ON os.container_number = c.container_number
  WHERE c.status::text = ANY(container_statuses);
END;
$$ LANGUAGE plpgsql STABLE;

-- Функция для подсчета статуса отгрузки заказа на основе order_shipments
CREATE OR REPLACE FUNCTION calculate_shipment_status(order_id_param uuid)
RETURNS text AS $$
DECLARE
  total_places int;
  shipped_places int;
  in_transit_places int;
BEGIN
  -- Подсчитываем статистику по местам заказа
  SELECT 
    COALESCE(COUNT(*), 0),
    COALESCE(SUM(CASE WHEN shipment_status::text IN ('partially_shipped', 'in_transit') THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN shipment_status::text = 'in_transit' THEN 1 ELSE 0 END), 0)
  INTO total_places, shipped_places, in_transit_places
  FROM order_shipments
  WHERE order_id = order_id_param;

  -- Если нет мест, считаем not_shipped
  IF total_places = 0 THEN
    RETURN 'not_shipped';
  END IF;

  -- Если все места in_transit
  IF in_transit_places = total_places THEN
    RETURN 'in_transit';
  END IF;

  -- Если есть хотя бы одно отгруженное место
  IF shipped_places > 0 THEN
    RETURN 'partially_shipped';
  END IF;

  -- Иначе not_shipped
  RETURN 'not_shipped';
END;
$$ LANGUAGE plpgsql STABLE;

-- Функция для фильтрации заказов по статусам отгрузки
CREATE OR REPLACE FUNCTION filter_orders_by_shipment_statuses(
  shipment_statuses text[]
)
RETURNS TABLE (order_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT o.id as order_id
  FROM orders o
  WHERE calculate_shipment_status(o.id) = ANY(shipment_statuses);
END;
$$ LANGUAGE plpgsql STABLE;

-- Batch версия для получения статусов отгрузки (для статистики)
CREATE OR REPLACE FUNCTION batch_calculate_shipment_status(order_ids uuid[])
RETURNS TABLE (order_id uuid, status text) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as order_id,
    calculate_shipment_status(o.id) as status
  FROM unnest(order_ids) o(id);
END;
$$ LANGUAGE plpgsql STABLE;

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_order_shipments_order_id ON order_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_shipments_container_number ON order_shipments(container_number);
CREATE INDEX IF NOT EXISTS idx_order_shipments_shipment_status ON order_shipments(shipment_status);
CREATE INDEX IF NOT EXISTS idx_containers_container_number ON containers(container_number);
CREATE INDEX IF NOT EXISTS idx_containers_status ON containers(status);