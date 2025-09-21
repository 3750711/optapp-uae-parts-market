-- Шаг 1: Создание недостающего триггера для catalog_position
-- Этот триггер автоматически устанавливает catalog_position = created_at для новых товаров

-- Проверяем что функция set_catalog_position_on_insert существует (она уже была создана в предыдущих миграциях)
-- Создаем триггер который вызывает эту функцию BEFORE INSERT

CREATE TRIGGER set_catalog_position_on_insert_trigger
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_catalog_position_on_insert();

-- Логируем создание триггера
DO $$
BEGIN
  RAISE LOG 'Catalog positioning trigger created successfully';
END $$;