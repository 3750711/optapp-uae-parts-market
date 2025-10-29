-- Исправление security warnings: добавление SET search_path для новых функций фильтрации

-- 1. filter_orders_by_containers с SET search_path
CREATE OR REPLACE FUNCTION filter_orders_by_containers(
  container_numbers text[]
)
RETURNS TABLE (order_id uuid)
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT os.order_id
  FROM public.order_shipments os
  WHERE os.container_number = ANY(container_numbers);
END;
$$;

-- 2. filter_orders_by_container_statuses с SET search_path
CREATE OR REPLACE FUNCTION filter_orders_by_container_statuses(
  container_statuses text[]
)
RETURNS TABLE (order_id uuid)
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT os.order_id
  FROM public.order_shipments os
  INNER JOIN public.containers c ON os.container_number = c.container_number
  WHERE c.status::text = ANY(container_statuses);
END;
$$;

-- 3. calculate_shipment_status с SET search_path
CREATE OR REPLACE FUNCTION calculate_shipment_status(order_id_param uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
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
  FROM public.order_shipments
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
$$;

-- 4. filter_orders_by_shipment_statuses с SET search_path
CREATE OR REPLACE FUNCTION filter_orders_by_shipment_statuses(
  shipment_statuses text[]
)
RETURNS TABLE (order_id uuid)
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT o.id as order_id
  FROM public.orders o
  WHERE public.calculate_shipment_status(o.id) = ANY(shipment_statuses);
END;
$$;

-- 5. batch_calculate_shipment_status с SET search_path
CREATE OR REPLACE FUNCTION batch_calculate_shipment_status(order_ids uuid[])
RETURNS TABLE (order_id uuid, status text)
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as order_id,
    public.calculate_shipment_status(o.id) as status
  FROM unnest(order_ids) o(id);
END;
$$;