
-- Добавляем поля оптимизации в таблицу products
ALTER TABLE public.products 
ADD COLUMN has_active_offers BOOLEAN DEFAULT false,
ADD COLUMN max_offer_price NUMERIC DEFAULT NULL,
ADD COLUMN offers_count INTEGER DEFAULT 0;

-- Создаем индекс для быстрого поиска товаров с активными предложениями
CREATE INDEX idx_products_has_active_offers ON public.products(has_active_offers);

-- Исправляем время истечения предложений на 6 часов
ALTER TABLE public.price_offers 
ALTER COLUMN expires_at SET DEFAULT (now() + INTERVAL '6 hours');

-- Создаем функцию для обновления флагов оптимизации в products
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

-- Создаем функцию для получения данных о конкурентных предложениях
CREATE OR REPLACE FUNCTION get_competitive_offer_data(p_product_id UUID, p_user_id UUID)
RETURNS TABLE(
  max_offer_price NUMERIC,
  current_user_is_max BOOLEAN,
  current_user_offer_price NUMERIC,
  has_pending_offer BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT MAX(offered_price) FROM public.price_offers 
     WHERE product_id = p_product_id AND status = 'pending' AND expires_at > NOW()),
    (SELECT offered_price FROM public.price_offers 
     WHERE product_id = p_product_id AND buyer_id = p_user_id AND status = 'pending' AND expires_at > NOW()
     LIMIT 1) = (SELECT MAX(offered_price) FROM public.price_offers 
                 WHERE product_id = p_product_id AND status = 'pending' AND expires_at > NOW()),
    (SELECT offered_price FROM public.price_offers 
     WHERE product_id = p_product_id AND buyer_id = p_user_id AND status = 'pending' AND expires_at > NOW()
     LIMIT 1),
    EXISTS(SELECT 1 FROM public.price_offers 
           WHERE product_id = p_product_id AND buyer_id = p_user_id AND status = 'pending' AND expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
