-- ============================================
-- Добавляем поля для системы подтверждения webhook
-- ============================================

-- Добавляем поле для отслеживания статуса уведомлений
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS telegram_notification_status VARCHAR(20) 
  CHECK (telegram_notification_status IN ('not_sent', 'pending', 'sent', 'failed'))
  DEFAULT 'not_sent';

-- ID сообщения в Telegram группе
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS telegram_message_id BIGINT;

-- Время подтверждения доставки ботом
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS telegram_confirmed_at TIMESTAMPTZ;

-- Текст последней ошибки для диагностики
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS telegram_last_error TEXT;

-- Индекс для быстрой фильтрации проблемных товаров
CREATE INDEX IF NOT EXISTS idx_products_telegram_status 
  ON products(telegram_notification_status) 
  WHERE telegram_notification_status IN ('pending', 'failed', 'not_sent');

-- Комментарии для документации
COMMENT ON COLUMN products.telegram_notification_status IS 
  'not_sent - уведомление еще не отправлялось
   pending - отправлено в Telegram API, ждем подтверждения от webhook
   sent - подтверждено ботом (бот увидел сообщение в группе)
   failed - ошибка отправки или webhook не подтвердил за 5 минут';

COMMENT ON COLUMN products.telegram_message_id IS 
  'ID сообщения в Telegram группе (получен от webhook)';

COMMENT ON COLUMN products.telegram_confirmed_at IS 
  'Время когда бот подтвердил доставку (увидел сообщение в группе)';

COMMENT ON COLUMN products.telegram_last_error IS 
  'Текст последней ошибки для debugging';