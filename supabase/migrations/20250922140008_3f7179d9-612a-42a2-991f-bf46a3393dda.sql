-- Обновляем функцию create_product_with_images для поддержки брендов и моделей
CREATE OR REPLACE FUNCTION public.create_product_with_images(
    p_title TEXT,
    p_price NUMERIC,
    p_description TEXT DEFAULT NULL,
    p_condition TEXT DEFAULT 'Новый',
    p_brand TEXT DEFAULT '',
    p_model TEXT DEFAULT NULL,
    p_place_number INTEGER DEFAULT 1,
    p_delivery_price NUMERIC DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_product_id UUID;
    v_user_profile RECORD;
BEGIN
    -- Получаем профиль пользователя
    SELECT id, full_name, is_trusted_seller, opt_id
    INTO v_user_profile
    FROM public.profiles 
    WHERE id = auth.uid();
    
    -- Проверяем существование пользователя
    IF v_user_profile.id IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;
    
    -- Создаем товар
    INSERT INTO public.products (
        title,
        price, 
        description,
        condition,
        brand,
        model,
        place_number,
        delivery_price,
        seller_id,
        seller_name,
        optid_created,
        status
    ) VALUES (
        p_title,
        p_price,
        p_description,
        COALESCE(p_condition, 'Новый'),
        COALESCE(p_brand, ''),
        p_model,
        COALESCE(p_place_number, 1),
        COALESCE(p_delivery_price, 0),
        v_user_profile.id,
        COALESCE(v_user_profile.full_name, 'Unknown Seller'),
        v_user_profile.opt_id,
        CASE 
            WHEN COALESCE(v_user_profile.is_trusted_seller, false) THEN 'active'::product_status
            ELSE 'pending'::product_status 
        END
    )
    RETURNING id INTO v_product_id;
    
    -- Логируем создание товара
    RAISE LOG 'Product created: %, seller: %, status: %, brand: %, model: %', 
        v_product_id, 
        v_user_profile.full_name,
        CASE WHEN COALESCE(v_user_profile.is_trusted_seller, false) THEN 'active' ELSE 'pending' END,
        COALESCE(p_brand, ''),
        COALESCE(p_model, '');
    
    RETURN v_product_id;
END;
$$;