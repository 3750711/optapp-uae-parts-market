-- Политика для публичного доступа к товарам через токен профиля
CREATE POLICY "Enable public access to products via profile token" ON public.products
FOR SELECT TO anon, authenticated
USING (
  status = 'active' 
  AND seller_id IN (
    SELECT id FROM public.profiles 
    WHERE public_share_enabled = true 
    AND public_share_expires_at > now()
    AND public_share_token = COALESCE((current_setting('app.current_profile_token', true))::uuid, NULL::uuid)
  )
);

-- Политика для публичного доступа к изображениям товаров через токен профиля
CREATE POLICY "Enable public access to product images via profile token" ON public.product_images
FOR SELECT TO anon, authenticated
USING (
  product_id IN (
    SELECT p.id 
    FROM products p 
    JOIN profiles pr ON p.seller_id = pr.id
    WHERE p.status = 'active' 
    AND pr.public_share_enabled = true 
    AND pr.public_share_expires_at > now()
    AND pr.public_share_token = COALESCE((current_setting('app.current_profile_token', true))::uuid, NULL::uuid)
  )
);

-- Политика для публичного доступа к видео товаров через токен профиля
CREATE POLICY "Enable public access to product videos via profile token" ON public.product_videos
FOR SELECT TO anon, authenticated
USING (
  product_id IN (
    SELECT p.id 
    FROM products p 
    JOIN profiles pr ON p.seller_id = pr.id
    WHERE p.status = 'active' 
    AND pr.public_share_enabled = true 
    AND pr.public_share_expires_at > now()
    AND pr.public_share_token = COALESCE((current_setting('app.current_profile_token', true))::uuid, NULL::uuid)
  )
);

-- Политика для публичного доступа к профилю продавца через токен
CREATE POLICY "Enable public access to profile via token" ON public.profiles
FOR SELECT TO anon, authenticated
USING (
  user_type = 'seller'
  AND public_share_enabled = true 
  AND public_share_expires_at > now()
  AND public_share_token = COALESCE((current_setting('app.current_profile_token', true))::uuid, NULL::uuid)
);