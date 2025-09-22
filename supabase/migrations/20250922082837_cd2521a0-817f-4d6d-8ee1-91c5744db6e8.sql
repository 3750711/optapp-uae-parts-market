-- Обновляем функцию триггера - убираем Authorization header, так как функция теперь публичная
CREATE OR REPLACE FUNCTION public.trigger_ai_enrichment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Запускаем AI обработку только для товаров со статусом 'pending'
  IF NEW.status = 'pending' AND NEW.ai_enriched_at IS NULL THEN
    -- Вызываем Edge Function асинхронно (без авторизации, функция публичная)
    BEGIN
      PERFORM
        net.http_post(
          url := public.functions_url('ai-enrich-product'),
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := jsonb_build_object(
            'product_id', NEW.id,
            'title', NEW.title,
            'auto_trigger', true
          )
        );
      RAISE LOG 'AI enrichment triggered for product %: %', NEW.id, NEW.title;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error triggering AI enrichment for product %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;