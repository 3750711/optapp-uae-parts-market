import { Product } from '@/types/product';

/**
 * Проверяет, есть ли у товара проблема с уведомлением
 * Показывает индикатор только если:
 * 1. Товар активен (status = 'active')
 * 2. Триггер notify_on_product_status_changes сработал (last_notification_sent_at не null)
 * 3. Но в логах telegram_notifications_log нет записи о доставке (notification_logs пустой)
 */
export const hasNotificationIssue = (product: Product): boolean => {
  return (
    product.status === 'active' &&
    product.last_notification_sent_at !== null &&
    product.last_notification_sent_at !== undefined &&
    (!product.notification_logs || product.notification_logs.length === 0)
  );
};

/**
 * Возвращает детальное описание проблемы с уведомлением
 */
export const getNotificationIssueReason = (product: Product): string => {
  if (!hasNotificationIssue(product)) {
    return '';
  }
  
  const attemptTime = product.last_notification_sent_at 
    ? new Date(product.last_notification_sent_at).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'неизвестно';
  
  return `Триггер сработал ${attemptTime}, но Edge Function не смогла отправить уведомление в Telegram. Возможные причины: таймаут (5 сек), ошибка в коде Edge Function, проблемы с Telegram API.`;
};
