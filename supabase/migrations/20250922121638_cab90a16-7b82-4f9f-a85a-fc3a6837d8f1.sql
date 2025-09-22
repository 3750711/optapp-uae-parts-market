-- ШАГ 1: Создаем тестовый товар для проверки AI обучения
INSERT INTO products (
  title, 
  price, 
  status, 
  seller_id,
  brand,
  model,
  condition,
  description,
  seller_name
) VALUES (
  'engine 1zz toyota camry used',  -- Название для AI обработки (с ошибками)
  100,
  'pending',  -- Статус для триггера AI
  (SELECT id FROM profiles WHERE user_type = 'seller' LIMIT 1),
  'Unknown',  -- Заведомо неточная марка
  'Unknown',  -- Заведомо неточная модель  
  'used',
  'Test product for AI enrichment and learning system',
  'Test Seller'
) RETURNING id, title, status, created_at;