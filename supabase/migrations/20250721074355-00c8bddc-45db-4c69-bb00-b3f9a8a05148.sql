
-- Исправляем SQL запрос для проверки триггера (убираем несуществующий столбец)
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'update_product_offer_flags_trigger';

-- Проверяем, что функция существует и имеет SECURITY DEFINER
SELECT 
  routine_name,
  routine_type,
  security_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'update_product_offer_flags';

-- Если триггер не создался, создаем его заново
DROP TRIGGER IF EXISTS update_product_offer_flags_trigger ON public.price_offers;

-- Пересоздаем функцию с правильными правами
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

-- Создаем триггер
CREATE TRIGGER update_product_offer_flags_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.price_offers
  FOR EACH ROW EXECUTE FUNCTION update_product_offer_flags();

-- Финальная проверка создания триггера
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'update_product_offer_flags_trigger';

-- Обновляем существующие данные в products
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
