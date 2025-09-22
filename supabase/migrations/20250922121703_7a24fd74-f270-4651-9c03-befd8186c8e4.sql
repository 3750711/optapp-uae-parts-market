-- ШАГ 1: Создаем тестовый товар для проверки AI обучения (исправленный)
WITH seller_info AS (
  SELECT id, full_name 
  FROM profiles 
  WHERE user_type = 'seller' 
  LIMIT 1
)
INSERT INTO products (
  title, 
  price, 
  status, 
  seller_id,
  seller_name,
  brand,
  model,
  condition,
  description
) 
SELECT 
  'engine 1zz toyota camry used',  -- Название для AI обработки
  100,
  'pending',  -- Статус для триггера AI
  si.id,
  COALESCE(si.full_name, 'Test Seller'),  -- Имя продавца
  'Unknown',  -- Заведомо неточная марка
  'Unknown',  -- Заведомо неточная модель  
  'used',
  'Test product for AI enrichment and learning system'
FROM seller_info si
RETURNING id, title, status, seller_name, created_at;