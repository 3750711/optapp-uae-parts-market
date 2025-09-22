-- Обновляем функцию триггера для передачи Service Role Key
CREATE OR REPLACE FUNCTION public.trigger_ai_enrichment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Запускаем AI обработку только для товаров со статусом 'pending'
  IF NEW.status = 'pending' AND NEW.ai_enriched_at IS NULL THEN
    -- Вызываем Edge Function асинхронно с Service Role Key для авторизации
    BEGIN
      PERFORM
        net.http_post(
          url := public.functions_url('ai-enrich-product'),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
          ),
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