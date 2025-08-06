-- Insert initial FAQ items
INSERT INTO public.help_items (category_id, question, answer, order_index)
SELECT 
  c.id,
  'Как начать использовать платформу?',
  'Для начала работы зарегистрируйтесь на платформе, заполните профиль и подтвердите свою учетную запись.',
  1
FROM public.help_categories c WHERE c.title = 'Общие вопросы';

INSERT INTO public.help_items (category_id, question, answer, order_index)
SELECT 
  c.id,
  'Как найти нужную запчасть?',
  'Используйте поиск по названию, бренду или модели автомобиля. Также можно просматривать каталог по категориям.',
  2
FROM public.help_categories c WHERE c.title = 'Общие вопросы';

INSERT INTO public.help_items (category_id, question, answer, order_index)
SELECT 
  c.id,
  'Как создать аккаунт?',
  'Нажмите "Регистрация" в верхней части сайта, заполните необходимые данные и подтвердите email.',
  1
FROM public.help_categories c WHERE c.title = 'Регистрация и аккаунт';

INSERT INTO public.help_items (category_id, question, answer, order_index)
SELECT 
  c.id,
  'Забыл пароль, что делать?',
  'Нажмите "Забыли пароль?" на странице входа и следуйте инструкциям для восстановления.',
  2
FROM public.help_categories c WHERE c.title = 'Регистрация и аккаунт';

INSERT INTO public.help_items (category_id, question, answer, order_index)
SELECT 
  c.id,
  'Как оформить заказ?',
  'Выберите нужный товар, нажмите "Купить", заполните данные доставки и выберите способ оплаты.',
  1
FROM public.help_categories c WHERE c.title = 'Покупки и заказы';

INSERT INTO public.help_items (category_id, question, answer, order_index)
SELECT 
  c.id,
  'Можно ли отменить заказ?',
  'Да, заказ можно отменить в течение первых часов после оформления через личный кабинет.',
  2
FROM public.help_categories c WHERE c.title = 'Покупки и заказы';

INSERT INTO public.help_items (category_id, question, answer, order_index)
SELECT 
  c.id,
  'Как выставить товар на продажу?',
  'Зайдите в личный кабинет продавца, нажмите "Добавить товар" и заполните всю необходимую информацию.',
  1
FROM public.help_categories c WHERE c.title = 'Продажи';

INSERT INTO public.help_items (category_id, question, answer, order_index)
SELECT 
  c.id,
  'Сколько стоит размещение товара?',
  'Базовое размещение товара бесплатно. Доступны платные опции для продвижения.',
  2
FROM public.help_categories c WHERE c.title = 'Продажи';

INSERT INTO public.help_items (category_id, question, answer, order_index)
SELECT 
  c.id,
  'Какие способы оплаты доступны?',
  'Принимаем банковские карты, электронные кошельки и наличные при самовывозе.',
  1
FROM public.help_categories c WHERE c.title = 'Оплата и доставка';

INSERT INTO public.help_items (category_id, question, answer, order_index)
SELECT 
  c.id,
  'Сколько стоит доставка?',
  'Стоимость доставки рассчитывается индивидуально в зависимости от веса, размера и адреса доставки.',
  2
FROM public.help_categories c WHERE c.title = 'Оплата и доставка';

INSERT INTO public.help_items (category_id, question, answer, order_index)
SELECT 
  c.id,
  'Не работает сайт, что делать?',
  'Попробуйте обновить страницу или очистить кеш браузера. Если проблема сохраняется, обратитесь в поддержку.',
  1
FROM public.help_categories c WHERE c.title = 'Техническая поддержка';

INSERT INTO public.help_items (category_id, question, answer, order_index)
SELECT 
  c.id,
  'Как связаться с поддержкой?',
  'Используйте форму обратной связи на этой странице или напишите на support@example.com',
  2
FROM public.help_categories c WHERE c.title = 'Техническая поддержка';