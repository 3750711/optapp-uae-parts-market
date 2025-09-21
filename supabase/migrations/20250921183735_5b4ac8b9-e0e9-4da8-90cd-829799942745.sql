-- Переименовываем функцию триггера согласно спецификации
DROP FUNCTION IF EXISTS public.freeze_views_on_sold() CASCADE;

CREATE OR REPLACE FUNCTION public.fn_freeze_tg_views_on_sold()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Срабатываем только при переходе в статус 'sold'
  IF (TG_OP = 'UPDATE')
     AND (NEW.status = 'sold')
     AND (COALESCE(OLD.status::text, '') IS DISTINCT FROM 'sold') THEN
     
     -- Фиксируем только если ещё не зафиксировано
     IF NEW.tg_views_frozen IS NULL THEN
       NEW.tg_views_frozen := COALESCE(public.estimate_tg_views(NEW.id, NEW.created_at), 0);
     END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Пересоздаём триггер с новым именем
DROP TRIGGER IF EXISTS trg_freeze_tg_views_on_sold ON public.products;

CREATE TRIGGER trg_freeze_tg_views_on_sold
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.fn_freeze_tg_views_on_sold();