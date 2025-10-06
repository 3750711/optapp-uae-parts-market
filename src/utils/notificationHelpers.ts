import { Product } from '@/types/product';

/**
 * Проверяет, есть ли у товара проблема с уведомлением
 * Показывает индикатор если telegram_notification_status === 'failed'
 */
export const hasNotificationIssue = (product: Product): boolean => {
  return product.telegram_notification_status === 'failed';
};

/**
 * Проверяет, было ли уведомление успешно отправлено
 */
export const isNotificationSent = (product: Product): boolean => {
  return product.telegram_notification_status === 'sent';
};

/**
 * Проверяет, находится ли уведомление в статусе ожидания
 */
export const isNotificationPending = (product: Product): boolean => {
  return product.telegram_notification_status === 'pending';
};

/**
 * Возвращает детальное описание проблемы с уведомлением
 */
export const getNotificationIssueReason = (product: Product): string => {
  if (!hasNotificationIssue(product)) {
    return '';
  }
  
  const errorDetails = product.telegram_last_error || 'Неизвестная ошибка';
  const attemptTime = product.last_notification_sent_at 
    ? new Date(product.last_notification_sent_at).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'неизвестно';
  
  return `Попытка отправки ${attemptTime} завершилась ошибкой: ${errorDetails}`;
};

/**
 * Форматирует дату подтверждения для тултипа
 */
export const getConfirmationDate = (product: Product): string => {
  if (!product.telegram_confirmed_at) {
    return '';
  }
  
  return new Date(product.telegram_confirmed_at).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
