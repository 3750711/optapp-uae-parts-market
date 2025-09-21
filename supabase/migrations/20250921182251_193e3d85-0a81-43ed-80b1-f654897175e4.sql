-- Пересоздаем представление products_with_view_estimate для корректного расчета просмотров
-- Теперь просмотры будут показываться независимо от статуса отправки в Telegram

DROP VIEW IF EXISTS products_with_view_estimate;

CREATE VIEW products_with_view_estimate AS
SELECT p.id,
    p.title,
    p.lot_number,
    p.price,
    p.brand,
    p.model,
    p.seller_id,
    p.seller_name,
    p.status,
    p.condition,
    p.description,
    p.location,
    p.created_at,
    p.updated_at,
    p.telegram_url,
    p.phone_url,
    p.product_url,
    p.optid_created,
    p.rating_seller,
    p.place_number,
    p.product_location,
    p.delivery_price,
    p.last_notification_sent_at,
    p.preview_image_url,
    p.cloudinary_public_id,
    p.cloudinary_url,
    p.view_count,
    p.admin_notification_sent_at,
    p.tg_notify_status,
    p.tg_notify_attempts,
    p.tg_notify_error,
    p.catalog_position,
    -- Используем функцию estimate_tg_views для всех товаров независимо от статуса
    public.estimate_tg_views(p.created_at) AS tg_views_estimate
FROM products p;