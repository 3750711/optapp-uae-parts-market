-- 1. Добавляем недостающие колонки в order_shipments (если их нет)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_shipments' AND column_name = 'sticker_generated_at'
  ) THEN
    ALTER TABLE order_shipments ADD COLUMN sticker_generated_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_shipments' AND column_name = 'sticker_pdf_url'
  ) THEN
    ALTER TABLE order_shipments ADD COLUMN sticker_pdf_url TEXT;
  END IF;
END $$;

-- 2. Создаём sequence для автоинкремента sticker_number
CREATE SEQUENCE IF NOT EXISTS sticker_number_seq START WITH 1;

-- Синхронизируем sequence с текущим максимальным значением
SELECT setval('sticker_number_seq', COALESCE((SELECT MAX(sticker_number) FROM orders), 0));

-- 3. Функция для batch-обновления стикеров
CREATE OR REPLACE FUNCTION public.batch_update_stickers(
  order_ids uuid[],
  sticker_pdf text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_sticker_num integer;
  total_stickers integer := 0;
  sticker_numbers integer[] := '{}';
BEGIN
  -- Получаем следующий номер стикера
  next_sticker_num := nextval('sticker_number_seq');
  
  -- Обновляем orders (назначаем sticker_number для каждого заказа)
  WITH updated_orders AS (
    UPDATE orders
    SET 
      sticker_generated_at = NOW(),
      sticker_pdf_url = sticker_pdf,
      sticker_number = next_sticker_num + (
        SELECT COUNT(*) 
        FROM unnest(order_ids) WITH ORDINALITY AS t(id, ord)
        WHERE t.ord < (
          SELECT ord FROM unnest(order_ids) WITH ORDINALITY AS t2(id2, ord) 
          WHERE t2.id2 = orders.id
        )
      )
    WHERE id = ANY(order_ids)
    RETURNING id, sticker_number
  )
  SELECT COUNT(*), array_agg(sticker_number ORDER BY sticker_number) 
  INTO total_stickers, sticker_numbers
  FROM updated_orders;
  
  -- Обновляем order_shipments
  UPDATE order_shipments
  SET
    sticker_generated_at = NOW(),
    sticker_pdf_url = sticker_pdf
  WHERE order_id = ANY(order_ids);
  
  RETURN jsonb_build_object(
    'next_sticker_number', next_sticker_num,
    'total_stickers', total_stickers,
    'sticker_numbers', sticker_numbers
  );
END;
$$;