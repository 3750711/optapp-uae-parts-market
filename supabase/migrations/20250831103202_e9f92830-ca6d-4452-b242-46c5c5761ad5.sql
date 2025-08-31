-- Now recreate simple, working policies for the tables that need them

-- confirm_images - basic working policies
CREATE POLICY "confirm_images_select_policy" ON public.confirm_images
FOR SELECT USING (
  is_admin() OR (EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = confirm_images.order_id 
    AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
  ))
);

CREATE POLICY "confirm_images_insert_policy" ON public.confirm_images
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (
    is_admin() OR (EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = confirm_images.order_id 
      AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    ))
  )
);

CREATE POLICY "confirm_images_delete_policy" ON public.confirm_images
FOR DELETE USING (
  is_admin() OR (EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = confirm_images.order_id 
    AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
  ))
);

-- order_images - basic working policies
CREATE POLICY "Users can view order images" ON public.order_images
FOR SELECT USING (
  (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_images.order_id 
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  )) OR is_admin()
);

CREATE POLICY "Users can insert order images" ON public.order_images
FOR INSERT WITH CHECK (
  (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_images.order_id 
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  )) OR is_admin()
);

CREATE POLICY "Users can update order images" ON public.order_images
FOR UPDATE USING (
  (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_images.order_id 
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  )) OR is_admin()
);

CREATE POLICY "Users can delete order images" ON public.order_images
FOR DELETE USING (
  (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_images.order_id 
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  )) OR is_admin()
);

-- order_videos - basic working policies
CREATE POLICY "Users can view order videos" ON public.order_videos
FOR SELECT USING (
  (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_videos.order_id 
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  )) OR is_admin()
);

CREATE POLICY "Users can insert order videos" ON public.order_videos
FOR INSERT WITH CHECK (
  (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_videos.order_id 
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  )) OR is_admin()
);

CREATE POLICY "Users can update order videos" ON public.order_videos
FOR UPDATE USING (
  (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_videos.order_id 
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  )) OR is_admin()
);

CREATE POLICY "Users can delete order videos" ON public.order_videos
FOR DELETE USING (
  (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_videos.order_id 
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  )) OR is_admin()
);

-- product_images - restore working policies
CREATE POLICY "Public view product images" ON public.product_images
FOR SELECT USING (true);

CREATE POLICY "Sellers manage product images" ON public.product_images
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_images.product_id 
    AND (products.seller_id = auth.uid() OR is_admin())
  )
);

-- products - restore working policies  
CREATE POLICY "Public view active products" ON public.products
FOR SELECT USING (
  status IN ('active', 'sold') OR 
  is_admin() OR
  seller_id = auth.uid()
);

CREATE POLICY "Sellers manage own products" ON public.products
FOR ALL USING (
  seller_id = auth.uid() OR is_admin()
);

CREATE POLICY "Auth users create products" ON public.products
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (
    seller_id = auth.uid() OR is_admin()
  )
);

-- profiles - restore simple working policies
CREATE POLICY "Users view own profile" ON public.profiles
FOR SELECT USING (
  id = auth.uid() OR is_admin()
);

CREATE POLICY "Users update own profile" ON public.profiles
FOR UPDATE USING (
  id = auth.uid() OR is_admin()
);

CREATE POLICY "Users insert own profile" ON public.profiles
FOR INSERT WITH CHECK (
  id = auth.uid()
);