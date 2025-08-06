-- Create help_categories table
CREATE TABLE public.help_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'HelpCircle',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create help_items table
CREATE TABLE public.help_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.help_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for help_categories
CREATE POLICY "Public can view help categories" 
ON public.help_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage help categories" 
ON public.help_categories 
FOR ALL 
USING (is_current_user_admin());

-- RLS Policies for help_items
CREATE POLICY "Public can view help items" 
ON public.help_items 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage help items" 
ON public.help_items 
FOR ALL 
USING (is_current_user_admin());

-- Create indexes
CREATE INDEX idx_help_categories_order ON public.help_categories(order_index);
CREATE INDEX idx_help_items_category ON public.help_items(category_id);
CREATE INDEX idx_help_items_order ON public.help_items(category_id, order_index);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_help_categories_updated_at
  BEFORE UPDATE ON public.help_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_help_items_updated_at
  BEFORE UPDATE ON public.help_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data from existing FAQ
INSERT INTO public.help_categories (title, icon_name, order_index) VALUES
  ('Общие вопросы', 'HelpCircle', 1),
  ('Регистрация и аккаунт', 'User', 2),
  ('Покупки и заказы', 'ShoppingCart', 3),
  ('Продажи', 'Package', 4),
  ('Оплата и доставка', 'CreditCard', 5),
  ('Техническая поддержка', 'Settings', 6);

-- Insert help items for each category
WITH categories AS (
  SELECT id, title FROM public.help_categories
)
INSERT INTO public.help_items (category_id, question, answer, order_index)
SELECT 
  c.id,
  q.question,
  q.answer,
  q.order_index
FROM categories c
CROSS JOIN (
  SELECT 'Как начать использовать платформу?' as question, 
         'Для начала работы зарегистрируйтесь на платформе, заполните профиль и подтвердите свою учетную запись.' as answer,
         1 as order_index
  WHERE c.title = 'Общие вопросы'
  UNION ALL
  SELECT 'Как найти нужную запчасть?', 
         'Используйте поиск по названию, бренду или модели автомобиля. Также можно просматривать каталог по категориям.',
         2
  WHERE c.title = 'Общие вопросы'
  UNION ALL
  SELECT 'Как создать аккаунт?',
         'Нажмите "Регистрация" в верхней части сайта, заполните необходимые данные и подтвердите email.',
         1
  WHERE c.title = 'Регистрация и аккаунт'
  UNION ALL
  SELECT 'Забыл пароль, что делать?',
         'Нажмите "Забыли пароль?" на странице входа и следуйте инструкциям для восстановления.',
         2
  WHERE c.title = 'Регистрация и аккаунт'
  UNION ALL
  SELECT 'Как оформить заказ?',
         'Выберите нужный товар, нажмите "Купить", заполните данные доставки и выберите способ оплаты.',
         1
  WHERE c.title = 'Покупки и заказы'
  UNION ALL
  SELECT 'Можно ли отменить заказ?',
         'Да, заказ можно отменить в течение первых часов после оформления через личный кабинет.',
         2
  WHERE c.title = 'Покупки и заказы'
  UNION ALL
  SELECT 'Как выставить товар на продажу?',
         'Зайдите в личный кабинет продавца, нажмите "Добавить товар" и заполните всю необходимую информацию.',
         1
  WHERE c.title = 'Продажи'
  UNION ALL
  SELECT 'Сколько стоит размещение товара?',
         'Базовое размещение товара бесплатно. Доступны платные опции для продвижения.',
         2
  WHERE c.title = 'Продажи'
  UNION ALL
  SELECT 'Какие способы оплаты доступны?',
         'Принимаем банковские карты, электронные кошельки и наличные при самовывозе.',
         1
  WHERE c.title = 'Оплата и доставка'
  UNION ALL
  SELECT 'Сколько стоит доставка?',
         'Стоимость доставки рассчитывается индивидуально в зависимости от веса, размера и адреса доставки.',
         2
  WHERE c.title = 'Оплата и доставка'
  UNION ALL
  SELECT 'Не работает сайт, что делать?',
         'Попробуйте обновить страницу или очистить кеш браузера. Если проблема сохраняется, обратитесь в поддержку.',
         1
  WHERE c.title = 'Техническая поддержка'
  UNION ALL
  SELECT 'Как связаться с поддержкой?',
         'Используйте форму обратной связи на этой странице или напишите на support@example.com',
         2
  WHERE c.title = 'Техническая поддержка'
) q ON c.title IN ('Общие вопросы', 'Регистрация и аккаунт', 'Покупки и заказы', 'Продажи', 'Оплата и доставка', 'Техническая поддержка');