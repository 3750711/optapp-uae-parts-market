
import { CreatedOrder, OrderFormData } from '@/types/order';
import { normalizeDecimal } from '@/utils/number';

/**
 * Безопасное получение номера заказа в виде строки
 */
export const getOrderNumberSafe = (order: CreatedOrder | any): string => {
  if (!order?.order_number) return 'Не указан';
  return order.order_number.toString();
};

/**
 * Получение отформатированного номера заказа (в верхнем регистре)
 */
export const getOrderNumberFormatted = (order: CreatedOrder | any): string => {
  return getOrderNumberSafe(order).toUpperCase();
};

/**
 * Проверка валидности номера заказа
 */
export const isValidOrderNumber = (orderNumber: any): boolean => {
  return orderNumber !== null && orderNumber !== undefined && 
         (typeof orderNumber === 'number' || typeof orderNumber === 'string');
};

/**
 * Безопасное получение цены заказа
 */
export const getOrderPriceSafe = (order: CreatedOrder | any): number => {
  if (!order?.price) return 0;
  return typeof order.price === 'number' ? order.price : normalizeDecimal(order.price);
};

/**
 * Форматирование цены заказа для отображения
 */
export const formatOrderPrice = (order: CreatedOrder | any): string => {
  const price = getOrderPriceSafe(order);
  return `$${price.toLocaleString()}`;
};
