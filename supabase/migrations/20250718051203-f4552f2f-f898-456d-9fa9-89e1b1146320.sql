-- Добавляем автоматическое истечение предложений цены
-- Создаем edge function для периодического вызова expire_old_price_offers

-- Включаем расширения для cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Планируем автоматическое истечение предложений каждые 5 минут
SELECT cron.schedule(
  'expire-price-offers',
  '*/5 * * * *', -- каждые 5 минут
  $$
  SELECT expire_old_price_offers();
  $$
);