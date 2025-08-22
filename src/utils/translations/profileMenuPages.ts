import { Lang } from '@/types/i18n';

export interface ProfileMenuTranslations {
  // Menu header
  profileSettings: string;
  notifications: string;
  language: string;
  
  // Seller specific menu items
  sellerDashboard: string;
  myProducts: string;
  addProduct: string;
  myOrders: string;
  priceOffers: string;
  
  // General menu items
  help: string;
  signOut: string;
  
  // User info
  optId: string;
  telegram: string;
  
  // Toast messages
  signedOut: string;
  signedOutDescription: string;
  
  // Status indicators
  unreadCount: string;
}

const ru: ProfileMenuTranslations = {
  // Menu header
  profileSettings: 'Настройки профиля',
  notifications: 'Уведомления',
  language: 'Язык',
  
  // Seller specific menu items
  sellerDashboard: 'Панель продавца',
  myProducts: 'Мои товары',
  addProduct: 'Добавить товар',
  myOrders: 'Мои заказы',
  priceOffers: 'Предложения цен',
  
  // General menu items
  help: 'Помощь',
  signOut: 'Выйти',
  
  // User info
  optId: 'OPT ID',
  telegram: 'Telegram',
  
  // Toast messages
  signedOut: 'Вы вышли из системы',
  signedOutDescription: 'До свидания!',
  
  // Status indicators
  unreadCount: 'непрочитанных'
};

const en: ProfileMenuTranslations = {
  // Menu header
  profileSettings: 'Profile Settings',
  notifications: 'Notifications',
  language: 'Language',
  
  // Seller specific menu items
  sellerDashboard: 'Seller Dashboard',
  myProducts: 'My Products',
  addProduct: 'Add Product',
  myOrders: 'My Orders',
  priceOffers: 'Price Offers',
  
  // General menu items
  help: 'Help',
  signOut: 'Sign Out',
  
  // User info
  optId: 'OPT ID',
  telegram: 'Telegram',
  
  // Toast messages
  signedOut: 'Signed out successfully',
  signedOutDescription: 'Goodbye!',
  
  // Status indicators
  unreadCount: 'unread'
};

const bn: ProfileMenuTranslations = {
  // Menu header
  profileSettings: 'প্রোফাইল সেটিংস',
  notifications: 'বিজ্ঞপ্তি',
  language: 'ভাষা',
  
  // Seller specific menu items
  sellerDashboard: 'বিক্রেতা ড্যাশবোর্ড',
  myProducts: 'আমার পণ্যসমূহ',
  addProduct: 'পণ্য যোগ করুন',
  myOrders: 'আমার অর্ডার',
  priceOffers: 'মূল্য অফার',
  
  // General menu items
  help: 'সাহায্য',
  signOut: 'সাইন আউট',
  
  // User info
  optId: 'OPT ID',
  telegram: 'টেলিগ্রাম',
  
  // Toast messages
  signedOut: 'সফলভাবে সাইন আউট হয়েছে',
  signedOutDescription: 'বিদায়!',
  
  // Status indicators
  unreadCount: 'অপঠিত'
};

export const profileMenuTranslations: Record<Lang, ProfileMenuTranslations> = {
  ru,
  en,
  bn
};

export const getProfileMenuTranslations = (lang: Lang): ProfileMenuTranslations => {
  return profileMenuTranslations[lang] || profileMenuTranslations.en;
};

export default getProfileMenuTranslations;