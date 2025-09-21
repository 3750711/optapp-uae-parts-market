-- Исправляем функцию триггера для корректной идемпотентности
CREATE OR REPLACE FUNCTION public.freeze_views_on_sold()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Срабатываем только при переходе в статус 'sold'
  IF (TG_OP = 'UPDATE')
     AND (NEW.status = 'sold')
     AND (COALESCE(OLD.status, '') IS DISTINCT FROM 'sold') THEN
     
     -- Фиксируем только если ещё не зафиксировано
     IF NEW.tg_views_frozen IS NULL THEN
       NEW.tg_views_frozen := COALESCE(public.estimate_tg_views(NEW.id, NEW.created_at), 0);
     END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill для уже проданных товаров
UPDATE public.products p
SET tg_views_frozen = COALESCE(public.estimate_tg_views(p.id, p.created_at), 0)
WHERE p.status = 'sold' AND p.tg_views_frozen IS NULL;