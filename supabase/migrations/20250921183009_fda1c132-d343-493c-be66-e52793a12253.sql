-- Шаг 2: Создаем триггер для фиксации просмотров при смене статуса на 'sold'

CREATE OR REPLACE FUNCTION public.freeze_views_on_sold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Проверяем изменился ли статус на 'sold'
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'sold' THEN
    -- Записываем текущую оценку просмотров в поле tg_views_frozen
    NEW.tg_views_frozen = public.estimate_tg_views(NEW.id, NEW.created_at);
    
    RAISE LOG 'Frozen views for product %: % views', NEW.id, NEW.tg_views_frozen;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Создаем триггер, который будет вызываться перед обновлением товара
CREATE TRIGGER freeze_views_on_sold_trigger
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.freeze_views_on_sold();