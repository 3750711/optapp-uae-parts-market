-- Исправление предупреждений безопасности для новых функций

-- Пересоздаем функцию set_catalog_position_on_insert с правильным search_path
CREATE OR REPLACE FUNCTION public.set_catalog_position_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Set catalog_position to created_at on new product creation
  IF NEW.catalog_position IS NULL THEN
    NEW.catalog_position := NEW.created_at;
  END IF;
  RETURN NEW;
END;
$function$;

-- Пересоздаем функцию validate_catalog_positioning с правильным search_path
CREATE OR REPLACE FUNCTION public.validate_catalog_positioning()
RETURNS TABLE(
  total_products bigint,
  products_with_null_position bigint,
  products_with_correct_position bigint,
  validation_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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