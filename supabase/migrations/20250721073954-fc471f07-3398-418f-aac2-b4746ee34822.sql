
-- Исправляем функцию триггера с правильными правами доступа
CREATE OR REPLACE FUNCTION update_product_offer_flags()
RETURNS TRIGGER 
SECURITY DEFINER -- Функция выполняется с правами создателя
AS $$
BEGIN
  -- Логируем выполнение триггера
  RAISE LOG 'Trigger update_product_offer_flags executing for product_id: %', COALESCE(NEW.product_id, OLD.product_id);
  
  -- Обновляем флаги для товара
  UPDATE public.products 
  SET 
    has_active_offers = EXISTS(
      SELECT 1 FROM public.price_offers 
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) 
      AND status = 'pending' 
      AND expires_at > NOW()
    ),
    max_offer_price = (
      SELECT MAX(offered_price) 
      FROM public.price_offers 
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) 
      AND status = 'pending' 
      AND expires_at > NOW()
    ),
    offers_count = (
      SELECT COUNT(*) 
      FROM public.price_offers 
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) 
      AND status = 'pending' 
      AND expires_at > NOW()
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RAISE LOG 'Trigger update_product_offer_flags completed for product_id: %', COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in update_product_offer_flags trigger: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Удаляем существующий триггер если есть
DROP TRIGGER IF EXISTS update_product_offer_flags_trigger ON public.price_offers;

-- Создаем новый триггер
CREATE TRIGGER update_product_offer_flags_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.price_offers
  FOR EACH ROW EXECUTE FUNCTION update_product_offer_flags();

-- Проверяем, что триггер создался
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  triggered_action_for 
FROM information_schema.triggers 
WHERE trigger_name = 'update_product_offer_flags_trigger';

-- Исправляем существующие данные в products
UPDATE public.products 
SET 
  has_active_offers = EXISTS(
    SELECT 1 FROM public.price_offers 
    WHERE product_id = products.id 
    AND status = 'pending' 
    AND expires_at > NOW()
  ),
  max_offer_price = (
    SELECT MAX(offered_price) 
    FROM public.price_offers 
    WHERE product_id = products.id 
    AND status = 'pending' 
    AND expires_at > NOW()
  ),
  offers_count = (
    SELECT COUNT(*) 
    FROM public.price_offers 
    WHERE product_id = products.id 
    AND status = 'pending' 
    AND expires_at > NOW()
  );

-- Включаем realtime для таблицы products
ALTER TABLE public.products REPLICA IDENTITY FULL;

-- Добавляем таблицу products в публикацию realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
END $$;
