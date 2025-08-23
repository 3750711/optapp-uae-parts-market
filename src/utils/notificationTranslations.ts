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
    'PRICE_OFFER_CANCELLED': 'Предложение цены отменено',
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
    'PRICE_OFFER_CANCELLED': (data) => `Ваше предложение цены отменено. ${data.reason === 'product_sold' ? 'Товар был продан' : 'Причина не указана'}`,
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
    'PRICE_OFFER_CANCELLED': 'Price Offer Cancelled',
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
    'PRICE_OFFER_CANCELLED': (data) => `Your price offer has been cancelled. ${data.reason === 'product_sold' ? 'Product was sold' : 'Reason not specified'}`,
    'PROFILE_UPDATE': (data) => 'Your profile has been updated',
    'SYSTEM_MESSAGE': (data) => data.message || 'System notification'
  }
};

// Bengali translations
export const bengaliTranslations: NotificationTranslations = {
  pageTitle: 'বিজ্ঞপ্তিসমূহ',
  backButton: 'ফিরে যান',
  unreadCount: (count: number) => count > 0 ? `${count} অপঠিত` : 'সব বিজ্ঞপ্তি পড়া হয়েছে',
  allRead: 'সব বিজ্ঞপ্তি পড়া হয়েছে',
  markAllAsRead: 'সব পড়েছি বলে চিহ্নিত করুন',
  markAllShort: 'সব',
  noNotifications: 'কোন বিজ্ঞপ্তি নেই',
  noNotificationsDesc: 'আপনার এখনো কোন বিজ্ঞপ্তি নেই',
  loading: 'বিজ্ঞপ্তি লোড হচ্ছে...',
  
  today: 'আজ',
  yesterday: 'গতকাল',
  thisWeek: 'এই সপ্তাহে',
  earlier: 'পূর্বে',
  
  markAsRead: 'পড়েছি বলে চিহ্নিত করুন',
  deleteNotification: 'বিজ্ঞপ্তি মুছুন',
  showAll: 'সব বিজ্ঞপ্তি দেখান',
  newLabel: 'নতুন',
  
  notificationTitles: {
    'NEW_ORDER': 'নতুন অর্ডার',
    'ORDER_CREATED': 'অর্ডার তৈরি হয়েছে',
    'ORDER_STATUS_CHANGE': 'অর্ডারের স্ট্যাটাস পরিবর্তন',
    'ORDER_CONFIRMATION': 'অর্ডার নিশ্চিতকরণ',
    'PRODUCT_STATUS_CHANGE': 'পণ্যের স্ট্যাটাস পরিবর্তন',
    'NEW_PRODUCT': 'নতুন পণ্য',
    'ADMIN_MESSAGE': 'অ্যাডমিনের বার্তা',
    'PRICE_OFFER': 'মূল্যের প্রস্তাব',
    'PRICE_OFFER_SUBMITTED': 'মূল্যের প্রস্তাব জমা দেওয়া হয়েছে',
    'PRICE_OFFER_RESPONSE': 'মূল্যের প্রস্তাবের উত্তর',
    'PRICE_OFFER_ACCEPTED': 'মূল্যের প্রস্তাব গৃহীত',
    'PRICE_OFFER_CANCELLED': 'মূল্যের প্রস্তাব বাতিল',
    'PROFILE_UPDATE': 'প্রোফাইল আপডেট',
    'SYSTEM_MESSAGE': 'সিস্টেম বার্তা'
  },
  
  notificationMessages: {
    'NEW_ORDER': (data) => `নতুন অর্ডার পেয়েছেন #${data.order_number || data.order_id}`,
    'ORDER_CREATED': (data) => `অর্ডার #${data.order_number || data.order_id} সফলভাবে তৈরি হয়েছে`,
    'ORDER_STATUS_CHANGE': (data) => `অর্ডার #${data.order_number || data.order_id} এর স্ট্যাটাস "${data.status}" এ পরিবর্তিত হয়েছে`,
    'ORDER_CONFIRMATION': (data) => `অর্ডার #${data.order_number || data.order_id} নিশ্চিত করা হয়েছে`,
    'PRODUCT_STATUS_CHANGE': (data) => `পণ্য "${data.title || 'পণ্য'}" এর স্ট্যাটাস "${data.status}" এ পরিবর্তিত হয়েছে`,
    'NEW_PRODUCT': (data) => `নতুন পণ্য যোগ করা হয়েছে: ${data.title || 'নতুন পণ্য'}`,
    'ADMIN_MESSAGE': (data) => data.message || 'অ্যাডমিনের কাছ থেকে নতুন বার্তা আছে',
    'PRICE_OFFER': (data) => `নতুন মূল্যের প্রস্তাব: $${data.offered_price}`,
    'PRICE_OFFER_SUBMITTED': (data) => `আপনার মূল্যের প্রস্তাব $${data.offered_price} জমা দেওয়া হয়েছে`,
    'PRICE_OFFER_RESPONSE': (data) => `আপনার মূল্যের প্রস্তাবের উত্তর পেয়েছেন`,
    'PRICE_OFFER_ACCEPTED': (data) => `আপনার মূল্যের প্রস্তাব $${data.offered_price} গৃহীত হয়েছে`,
    'PRICE_OFFER_CANCELLED': (data) => `আপনার মূল্যের প্রস্তাব বাতিল করা হয়েছে। ${data.reason === 'product_sold' ? 'পণ্য বিক্রি হয়ে গেছে' : 'কারণ উল্লেখ করা হয়নি'}`,
    'PROFILE_UPDATE': (data) => 'আপনার প্রোফাইল আপডেট করা হয়েছে',
    'SYSTEM_MESSAGE': (data) => data.message || 'সিস্টেম বিজ্ঞপ্তি'
  }
};

export const getNotificationTranslations = (language: 'ru' | 'en' | 'bn'): NotificationTranslations => {
  switch (language) {
    case 'bn': return bengaliTranslations;
    case 'en': return englishTranslations;
    case 'ru': 
    default: return russianTranslations;
  }
};

export const getNotificationLocale = (language: 'ru' | 'en' | 'bn') => {
  switch (language) {
    case 'bn': return 'en'; // Use English locale for Bengali as date-fns doesn't have Bengali
    case 'en': return 'en';
    case 'ru':
    default: return 'ru';
  }
};