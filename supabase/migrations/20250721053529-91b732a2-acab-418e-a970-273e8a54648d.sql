
-- Проверяем и добавляем поля оптимизации если их нет
DO $$
BEGIN
  -- Добавляем поля оптимизации в таблицу products
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'has_active_offers') THEN
    ALTER TABLE public.products ADD COLUMN has_active_offers BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'max_offer_price') THEN
    ALTER TABLE public.products ADD COLUMN max_offer_price NUMERIC DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'offers_count') THEN
    ALTER TABLE public.products ADD COLUMN offers_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Создаем индекс для быстрого поиска товаров с активными предложениями
CREATE INDEX IF NOT EXISTS idx_products_has_active_offers ON public.products(has_active_offers);

-- Создаем функцию для автоматического создания заказа при принятии предложения
CREATE OR REPLACE FUNCTION create_order_from_accepted_offer()
RETURNS TRIGGER AS $$
DECLARE
  product_record RECORD;
  buyer_profile RECORD;
  seller_profile RECORD;
  next_order_number INTEGER;
BEGIN
  -- Проверяем, что предложение было принято
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Получаем информацию о товаре
    SELECT * INTO product_record FROM public.products WHERE id = NEW.product_id;
    
    -- Получаем информацию о покупателе
    SELECT * INTO buyer_profile FROM public.profiles WHERE id = NEW.buyer_id;
    
    -- Получаем информацию о продавце
    SELECT * INTO seller_profile FROM public.profiles WHERE id = NEW.seller_id;
    
    -- Получаем следующий номер заказа
    SELECT COALESCE(MAX(order_number), 0) + 1 INTO next_order_number FROM public.orders;
    
    -- Создаем заказ
    INSERT INTO public.orders (
      order_number,
      title,
      price,
      original_price,
      place_number,
      seller_id,
      order_seller_name,
      seller_opt_id,
      buyer_id,
      buyer_opt_id,
      brand,
      model,
      status,
      order_created_type,
      product_id,
      delivery_method,
      telegram_url_order,
      telegram_url_buyer,
      quantity,
      description
    ) VALUES (
      next_order_number,
      product_record.title,
      NEW.offered_price, -- Используем предложенную цену
      NEW.original_price, -- Сохраняем оригинальную цену
      COALESCE(product_record.place_number, 1),
      NEW.seller_id,
      COALESCE(seller_profile.full_name, 'Unknown Seller'),
      seller_profile.opt_id,
      NEW.buyer_id,
      buyer_profile.opt_id,
      COALESCE(product_record.brand, ''),
      COALESCE(product_record.model, ''),
      'created',
      'price_offer',
      NEW.product_id,
      'self_pickup',
      seller_profile.telegram,
      buyer_profile.telegram,
      1,
      COALESCE(NEW.message, '')
    );
    
    -- Обновляем связь предложения с заказом
    UPDATE public.price_offers 
    SET order_id = (SELECT id FROM public.orders WHERE order_number = next_order_number)
    WHERE id = NEW.id;
    
    -- Обновляем статус продукта на sold
    UPDATE public.products 
    SET status = 'sold' 
    WHERE id = NEW.product_id;
    
    RAISE LOG 'Order created from accepted offer: order_number=%, offer_id=%', next_order_number, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматического создания заказа
DROP TRIGGER IF EXISTS create_order_from_accepted_offer_trigger ON public.price_offers;
CREATE TRIGGER create_order_from_accepted_offer_trigger
  AFTER UPDATE ON public.price_offers
  FOR EACH ROW 
  WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
  EXECUTE FUNCTION create_order_from_accepted_offer();

-- Включаем реалтайм для таблицы products
ALTER TABLE public.products REPLICA IDENTITY FULL;

-- Добавляем таблицу products в публикацию supabase_realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
END $$;

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
