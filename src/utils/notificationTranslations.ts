import { NotificationType } from '@/types/notification';

export interface NotificationTranslations {
  // Page interface
  pageTitle: string;
  backButton: string;
  unreadCount: (count: number) => string;
  allRead: string;
  markAllAsRead: string;
  markAllShort: string;
  noNotifications: string;
  noNotificationsDesc: string;
  loading: string;
  
  // Time groups
  today: string;
  yesterday: string;
  thisWeek: string;
  earlier: string;
  
  // Actions
  markAsRead: string;
  deleteNotification: string;
  showAll: string;
  newLabel: string;
  
  // Notification types and templates
  notificationTitles: Record<NotificationType, string>;
  notificationMessages: Record<NotificationType, (data: any) => string>;
}

export const russianTranslations: NotificationTranslations = {
  pageTitle: 'Уведомления',
  backButton: 'Назад',
  unreadCount: (count: number) => count > 0 ? `${count} непрочитанных` : 'Все уведомления прочитаны',
  allRead: 'Все уведомления прочитаны',
  markAllAsRead: 'Прочитать все',
  markAllShort: 'Все',
  noNotifications: 'Уведомления не найдены',
  noNotificationsDesc: 'У вас пока нет уведомлений',
  loading: 'Загрузка уведомлений...',
  
  today: 'Сегодня',
  yesterday: 'Вчера',
  thisWeek: 'На этой неделе',
  earlier: 'Ранее',
  
  markAsRead: 'Отметить как прочитанное',
  deleteNotification: 'Удалить уведомление',
  showAll: 'Показать все уведомления',
  newLabel: 'Новое',
  
  notificationTitles: {
    'NEW_ORDER': 'Новый заказ',
    'ORDER_CREATED': 'Заказ создан',
    'ORDER_STATUS_CHANGE': 'Изменение статуса заказа',
    'ORDER_CONFIRMATION': 'Подтверждение заказа',
    'PRODUCT_STATUS_CHANGE': 'Изменение статуса товара',
    'NEW_PRODUCT': 'Новый товар',
    'ADMIN_MESSAGE': 'Сообщение от администрации',
    'PRICE_OFFER': 'Предложение цены',
    'PRICE_OFFER_SUBMITTED': 'Предложение цены отправлено',
    'PRICE_OFFER_RESPONSE': 'Ответ на предложение цены',
    'PRICE_OFFER_ACCEPTED': 'Предложение цены принято',
    'PROFILE_UPDATE': 'Обновление профиля',
    'SYSTEM_MESSAGE': 'Системное сообщение'
  },
  
  notificationMessages: {
    'NEW_ORDER': (data) => `Получен новый заказ #${data.order_number || data.order_id}`,
    'ORDER_CREATED': (data) => `Заказ #${data.order_number || data.order_id} успешно создан`,
    'ORDER_STATUS_CHANGE': (data) => `Статус заказа #${data.order_number || data.order_id} изменен на "${data.status}"`,
    'ORDER_CONFIRMATION': (data) => `Заказ #${data.order_number || data.order_id} подтвержден`,
    'PRODUCT_STATUS_CHANGE': (data) => `Статус товара "${data.title || 'товар'}" изменен на "${data.status}"`,
    'NEW_PRODUCT': (data) => `Добавлен новый товар: ${data.title || 'новый товар'}`,
    'ADMIN_MESSAGE': (data) => data.message || 'У вас есть новое сообщение от администрации',
    'PRICE_OFFER': (data) => `Новое предложение цены: ${data.offered_price} руб.`,
    'PRICE_OFFER_SUBMITTED': (data) => `Ваше предложение цены ${data.offered_price} руб. отправлено`,
    'PRICE_OFFER_RESPONSE': (data) => `Получен ответ на ваше предложение цены`,
    'PRICE_OFFER_ACCEPTED': (data) => `Ваше предложение цены ${data.offered_price} руб. принято`,
    'PROFILE_UPDATE': (data) => 'Ваш профиль был обновлен',
    'SYSTEM_MESSAGE': (data) => data.message || 'Системное уведомление'
  }
};

export const englishTranslations: NotificationTranslations = {
  pageTitle: 'Notifications',
  backButton: 'Back',
  unreadCount: (count: number) => count > 0 ? `${count} unread` : 'All notifications read',
  allRead: 'All notifications read',
  markAllAsRead: 'Mark all as read',
  markAllShort: 'All',
  noNotifications: 'No notifications found',
  noNotificationsDesc: 'You have no notifications yet',
  loading: 'Loading notifications...',
  
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This week',
  earlier: 'Earlier',
  
  markAsRead: 'Mark as read',
  deleteNotification: 'Delete notification',
  showAll: 'Show all notifications',
  newLabel: 'New',
  
  notificationTitles: {
    'NEW_ORDER': 'New Order',
    'ORDER_CREATED': 'Order Created',
    'ORDER_STATUS_CHANGE': 'Order Status Changed',
    'ORDER_CONFIRMATION': 'Order Confirmation',
    'PRODUCT_STATUS_CHANGE': 'Product Status Changed',
    'NEW_PRODUCT': 'New Product',
    'ADMIN_MESSAGE': 'Admin Message',
    'PRICE_OFFER': 'Price Offer',
    'PRICE_OFFER_SUBMITTED': 'Price Offer Submitted',
    'PRICE_OFFER_RESPONSE': 'Price Offer Response',
    'PRICE_OFFER_ACCEPTED': 'Price Offer Accepted',
    'PROFILE_UPDATE': 'Profile Update',
    'SYSTEM_MESSAGE': 'System Message'
  },
  
  notificationMessages: {
    'NEW_ORDER': (data) => `New order received #${data.order_number || data.order_id}`,
    'ORDER_CREATED': (data) => `Order #${data.order_number || data.order_id} successfully created`,
    'ORDER_STATUS_CHANGE': (data) => `Order #${data.order_number || data.order_id} status changed to "${data.status}"`,
    'ORDER_CONFIRMATION': (data) => `Order #${data.order_number || data.order_id} confirmed`,
    'PRODUCT_STATUS_CHANGE': (data) => `Product "${data.title || 'product'}" status changed to "${data.status}"`,
    'NEW_PRODUCT': (data) => `New product added: ${data.title || 'new product'}`,
    'ADMIN_MESSAGE': (data) => data.message || 'You have a new message from administration',
    'PRICE_OFFER': (data) => `New price offer: $${data.offered_price}`,
    'PRICE_OFFER_SUBMITTED': (data) => `Your price offer $${data.offered_price} has been submitted`,
    'PRICE_OFFER_RESPONSE': (data) => `Response received for your price offer`,
    'PRICE_OFFER_ACCEPTED': (data) => `Your price offer $${data.offered_price} has been accepted`,
    'PROFILE_UPDATE': (data) => 'Your profile has been updated',
    'SYSTEM_MESSAGE': (data) => data.message || 'System notification'
  }
};

export const getNotificationTranslations = (userType: string): NotificationTranslations => {
  return userType === 'seller' ? englishTranslations : russianTranslations;
};

export const getNotificationLocale = (userType: string) => {
  return userType === 'seller' ? 'en' : 'ru';
};