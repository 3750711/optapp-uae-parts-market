-- Добавляем индекс для производительности функции expire_old_price_offers
CREATE INDEX IF NOT EXISTS idx_price_offers_status_expires_at 
ON price_offers(status, expires_at) 
WHERE status = 'pending';