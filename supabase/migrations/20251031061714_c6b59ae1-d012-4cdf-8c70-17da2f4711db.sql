-- Добавление полей для стикеров в таблицу orders
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS sticker_number INTEGER,
  ADD COLUMN IF NOT EXISTS sticker_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sticker_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS sender_code VARCHAR(10) DEFAULT 'SIN';

-- Создать индекс для быстрого поиска по номеру стикера
CREATE INDEX IF NOT EXISTS idx_orders_sticker_number 
  ON orders(sticker_number) 
  WHERE sticker_number IS NOT NULL;

-- Обновить существующие записи (установить значение по умолчанию)
UPDATE orders 
SET sender_code = 'SIN' 
WHERE sender_code IS NULL;

-- Добавить комментарии для документации
COMMENT ON COLUMN orders.sticker_number IS 'Уникальный номер стикера для печати (автоинкремент)';
COMMENT ON COLUMN orders.sticker_pdf_url IS 'URL сгенерированного PDF со стикерами (CraftMyPDF)';
COMMENT ON COLUMN orders.sticker_generated_at IS 'Timestamp последней генерации стикера';
COMMENT ON COLUMN orders.sender_code IS 'Код отправителя (SIN - Сингапур, DXB - Дубай и т.д.)';