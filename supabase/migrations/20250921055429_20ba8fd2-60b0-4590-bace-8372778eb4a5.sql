-- Восстановление системы позиционирования каталога

-- Шаг 1: Создаем триггер для автоматической установки catalog_position для новых товаров
CREATE OR REPLACE FUNCTION public.set_catalog_position_on_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Set catalog_position to created_at on new product creation
  IF NEW.catalog_position IS NULL THEN
    NEW.catalog_position := NEW.created_at;
  END IF;
  RETURN NEW;
END;
$function$;

-- Создаем триггер только если его еще нет
DROP TRIGGER IF EXISTS set_catalog_position_on_insert_trigger ON public.products;
CREATE TRIGGER set_catalog_position_on_insert_trigger
BEFORE INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_catalog_position_on_insert();

-- Шаг 2: Создаем составной индекс для оптимизации сортировки
DROP INDEX IF EXISTS idx_products_catalog_created;
CREATE INDEX idx_products_catalog_created ON public.products(catalog_position DESC, created_at DESC);

-- Шаг 3: Исправляем данные для существующих товаров где catalog_position IS NULL
UPDATE public.products 
SET catalog_position = created_at 
WHERE catalog_position IS NULL;

-- Шаг 4: Добавляем функцию для валидации системы позиционирования
CREATE OR REPLACE FUNCTION public.validate_catalog_positioning()
RETURNS TABLE(
  total_products bigint,
  products_with_null_position bigint,
  products_with_correct_position bigint,
  validation_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  total_count bigint;
  null_count bigint;
  correct_count bigint;
BEGIN
  -- Подсчитываем общее количество товаров
  SELECT COUNT(*) INTO total_count FROM public.products;
  
  -- Подсчитываем товары с NULL catalog_position
  SELECT COUNT(*) INTO null_count FROM public.products WHERE catalog_position IS NULL;
  
  -- Подсчитываем товары с корректной позицией
  SELECT COUNT(*) INTO correct_count FROM public.products WHERE catalog_position IS NOT NULL;
  
  RETURN QUERY SELECT 
    total_count,
    null_count,
    correct_count,
    CASE 
      WHEN null_count = 0 THEN 'OK: Все товары имеют catalog_position'
      ELSE 'WARNING: ' || null_count || ' товаров без catalog_position'
    END as validation_status;
END;
$function$;