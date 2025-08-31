-- Create only the missing policies that don't already exist

-- Check and create confirm_images policies (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'confirm_images' AND policyname = 'confirm_images_select_policy') THEN
        EXECUTE 'CREATE POLICY "confirm_images_select_policy" ON public.confirm_images FOR SELECT USING (is_admin() OR (EXISTS (SELECT 1 FROM orders o WHERE o.id = confirm_images.order_id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid()))))';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'confirm_images' AND policyname = 'confirm_images_insert_policy') THEN
        EXECUTE 'CREATE POLICY "confirm_images_insert_policy" ON public.confirm_images FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (is_admin() OR (EXISTS (SELECT 1 FROM orders o WHERE o.id = confirm_images.order_id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())))))';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'confirm_images' AND policyname = 'confirm_images_delete_policy') THEN
        EXECUTE 'CREATE POLICY "confirm_images_delete_policy" ON public.confirm_images FOR DELETE USING (is_admin() OR (EXISTS (SELECT 1 FROM orders o WHERE o.id = confirm_images.order_id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid()))))';
    END IF;
END $$;

-- Check and create order_images policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_images' AND policyname = 'Users can view order images') THEN
        EXECUTE 'CREATE POLICY "Users can view order images" ON public.order_images FOR SELECT USING ((EXISTS (SELECT 1 FROM orders WHERE orders.id = order_images.order_id AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid()))) OR is_admin())';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_images' AND policyname = 'Users can insert order images') THEN
        EXECUTE 'CREATE POLICY "Users can insert order images" ON public.order_images FOR INSERT WITH CHECK ((EXISTS (SELECT 1 FROM orders WHERE orders.id = order_images.order_id AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid()))) OR is_admin())';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_images' AND policyname = 'Users can update order images') THEN
        EXECUTE 'CREATE POLICY "Users can update order images" ON public.order_images FOR UPDATE USING ((EXISTS (SELECT 1 FROM orders WHERE orders.id = order_images.order_id AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid()))) OR is_admin())';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_images' AND policyname = 'Users can delete order images') THEN
        EXECUTE 'CREATE POLICY "Users can delete order images" ON public.order_images FOR DELETE USING ((EXISTS (SELECT 1 FROM orders WHERE orders.id = order_images.order_id AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid()))) OR is_admin())';
    END IF;
END $$;

-- Check and create order_videos policies  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_videos' AND policyname = 'Users can view order videos') THEN
        EXECUTE 'CREATE POLICY "Users can view order videos" ON public.order_videos FOR SELECT USING ((EXISTS (SELECT 1 FROM orders WHERE orders.id = order_videos.order_id AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid()))) OR is_admin())';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_videos' AND policyname = 'Users can insert order videos') THEN
        EXECUTE 'CREATE POLICY "Users can insert order videos" ON public.order_videos FOR INSERT WITH CHECK ((EXISTS (SELECT 1 FROM orders WHERE orders.id = order_videos.order_id AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid()))) OR is_admin())';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_videos' AND policyname = 'Users can update order videos') THEN
        EXECUTE 'CREATE POLICY "Users can update order videos" ON public.order_videos FOR UPDATE USING ((EXISTS (SELECT 1 FROM orders WHERE orders.id = order_videos.order_id AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid()))) OR is_admin())';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_videos' AND policyname = 'Users can delete order videos') THEN
        EXECUTE 'CREATE POLICY "Users can delete order videos" ON public.order_videos FOR DELETE USING ((EXISTS (SELECT 1 FROM orders WHERE orders.id = order_videos.order_id AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid()))) OR is_admin())';
    END IF;
END $$;

-- Check and create product_images policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_images' AND policyname = 'Sellers manage product images') THEN
        EXECUTE 'CREATE POLICY "Sellers manage product images" ON public.product_images FOR ALL USING (EXISTS (SELECT 1 FROM products WHERE products.id = product_images.product_id AND (products.seller_id = auth.uid() OR is_admin())))';
    END IF;
END $$;

-- Check and create products policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Public view active products') THEN
        EXECUTE 'CREATE POLICY "Public view active products" ON public.products FOR SELECT USING (status IN (''active'', ''sold'') OR is_admin() OR seller_id = auth.uid())';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Sellers manage own products') THEN
        EXECUTE 'CREATE POLICY "Sellers manage own products" ON public.products FOR ALL USING (seller_id = auth.uid() OR is_admin())';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Auth users create products') THEN
        EXECUTE 'CREATE POLICY "Auth users create products" ON public.products FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (seller_id = auth.uid() OR is_admin()))';
    END IF;
END $$;

-- Check and create profiles policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users view own profile') THEN
        EXECUTE 'CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (id = auth.uid() OR is_admin())';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users update own profile') THEN
        EXECUTE 'CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid() OR is_admin())';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users insert own profile') THEN
        EXECUTE 'CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid())';
    END IF;
END $$;