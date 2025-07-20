-- Phase 2: Performance Optimization для price offers системы

-- Композитный индекс для быстрых запросов по продукту, статусу и покупателю
CREATE INDEX IF NOT EXISTS idx_price_offers_product_status_buyer_optimized 
ON price_offers(product_id, status, buyer_id) 
WHERE status IN ('pending', 'accepted');

-- Индекс для поиска максимальных предложений по продукту
CREATE INDEX IF NOT EXISTS idx_price_offers_product_max_price 
ON price_offers(product_id, offered_price DESC) 
WHERE status = 'pending';

-- Индекс для запросов пользователя по его предложениям
CREATE INDEX IF NOT EXISTS idx_price_offers_buyer_status_updated 
ON price_offers(buyer_id, status, updated_at DESC);

-- Индекс для очистки истекших предложений (оптимизация функции expire_old_price_offers)
CREATE INDEX IF NOT EXISTS idx_price_offers_expires_at_status 
ON price_offers(expires_at, status) 
WHERE status = 'pending';

-- Частичный индекс для активных предложений (наиболее частые запросы)
CREATE INDEX IF NOT EXISTS idx_price_offers_active_only 
ON price_offers(product_id, buyer_id, offered_price DESC, created_at DESC) 
WHERE status = 'pending';

-- Оптимизация real-time: настройка REPLICA IDENTITY для полной репликации
ALTER TABLE price_offers REPLICA IDENTITY FULL;

-- Добавляем таблицу в publication для real-time обновлений (если еще не добавлена)
DO $$
BEGIN
  -- Проверяем, есть ли уже таблица в publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'price_offers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE price_offers;
  END IF;
END $$;