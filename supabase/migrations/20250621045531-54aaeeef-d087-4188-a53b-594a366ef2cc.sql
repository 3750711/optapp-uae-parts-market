
-- Создаем функцию для обновления медиафайлов заказа
CREATE OR REPLACE FUNCTION public.update_order_media(
  p_order_id uuid,
  p_images text[] DEFAULT NULL,
  p_video_url text[] DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Проверяем права доступа к заказу
  IF NOT EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = p_order_id 
    AND (
      buyer_id = auth.uid() OR 
      seller_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND user_type = 'admin'
      )
    )
  ) THEN
    RAISE EXCEPTION 'Access denied to order %', p_order_id;
  END IF;

  -- Обновляем медиафайлы заказа
  UPDATE public.orders
  SET 
    images = COALESCE(p_images, images),
    video_url = COALESCE(p_video_url, video_url),
    updated_at = now()
  WHERE id = p_order_id;

  -- Проверяем, что обновление прошло успешно
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  RETURN true;
END;
$$;
