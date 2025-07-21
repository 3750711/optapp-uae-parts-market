
-- Восстанавливаем отсутствующий триггер для автоматического обновления флагов предложений
CREATE OR REPLACE FUNCTION update_product_offer_flags()
RETURNS TRIGGER AS $$
BEGIN
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
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматического обновления флагов
DROP TRIGGER IF EXISTS update_product_offer_flags_trigger ON public.price_offers;
CREATE TRIGGER update_product_offer_flags_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.price_offers
  FOR EACH ROW EXECUTE FUNCTION update_product_offer_flags();

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

-- Добавляем продукты в realtime для получения изменений has_active_offers
ALTER TABLE public.products REPLICA IDENTITY FULL;

-- Убеждаемся, что таблица products в публикации realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
END $$;
