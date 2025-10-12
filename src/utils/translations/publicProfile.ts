import { Lang } from '@/types/i18n';

export interface PublicProfileTranslations {
  // Loading states
  loadingProfile: string;
  
  // Error states
  errorAccess: string;
  profileNotFound: string;
  goToHome: string;
  tokenNotFound: string;
  invalidOrExpiredLink: string;
  errorLoadingProducts: string;
  dataLoadingError: string;
  
  // Profile info
  autoPartsDealer: string;
  verified: string;
  rating: string;
  qualityAutoPartsCatalog: string;
  
  // Meta tags
  catalogTitle: (name: string) => string;
  catalogDescription: (name: string) => string;
  
  // Products section
  products: (count: number) => string;
  noActiveProducts: string;
  viewAllProducts: string;
  
  // Product card elements
  seller: string;
  location: string;
  lot: string;
  place: string;
  price: string;
  delivery: string;
  call: string;
  telegram: string;
  noImage: string;
}

const publicProfileTranslations: Record<Lang, PublicProfileTranslations> = {
  en: {
    // Loading states
    loadingProfile: 'Loading profile...',
    
    // Error states
    errorAccess: 'Access Error',
    profileNotFound: 'Profile not found',
    goToHome: 'Go to Home',
    tokenNotFound: 'Token not found',
    invalidOrExpiredLink: 'Invalid or expired link',
    errorLoadingProducts: 'Error loading products',
    dataLoadingError: 'An error occurred while loading data',
    
    // Profile info
    autoPartsDealer: 'Auto Parts Dealer',
    verified: 'Verified',
    rating: 'rating',
    qualityAutoPartsCatalog: 'Quality auto parts catalog in UAE',
    
    // Meta tags
    catalogTitle: (name: string) => `${name} - Auto Parts Catalog | PartsBay`,
    catalogDescription: (name: string) => `Auto parts catalog from ${name}. Quality parts with delivery in UAE.`,
    
    // Products section
    products: (count: number) => `Products (${count})`,
    noActiveProducts: 'This seller has no active products yet',
    viewAllProducts: 'View all products',
    
    // Product card elements
    seller: 'Seller',
    location: 'Location', 
    lot: 'Lot',
    place: 'Place',
    price: 'Price',
    delivery: 'Delivery',
    call: 'Call',
    telegram: 'Telegram',
    noImage: 'No image',
  },
  
  ru: {
    // Loading states
    loadingProfile: 'Загрузка профиля...',
    
    // Error states
    errorAccess: 'Ошибка доступа',
    profileNotFound: 'Профиль не найден',
    goToHome: 'Перейти на главную',
    tokenNotFound: 'Токен не найден',
    invalidOrExpiredLink: 'Недействительная или просроченная ссылка',
    errorLoadingProducts: 'Ошибка загрузки товаров',
    dataLoadingError: 'Произошла ошибка при загрузке данных',
    
    // Profile info
    autoPartsDealer: 'Продавец автозапчастей',
    verified: 'Проверен',
    rating: 'рейтинг',
    qualityAutoPartsCatalog: 'Каталог качественных автозапчастей в ОАЭ',
    
    // Meta tags
    catalogTitle: (name: string) => `${name} - Каталог автозапчастей | PartsBay`,
    catalogDescription: (name: string) => `Каталог автозапчастей от ${name}. Качественные запчасти с доставкой в ОАЭ.`,
    
    // Products section
    products: (count: number) => `Товары (${count})`,
    noActiveProducts: 'У этого продавца пока нет активных товаров',
    viewAllProducts: 'Посмотреть все товары',
    
    // Product card elements
    seller: 'Продавец',
    location: 'Местоположение',
    lot: 'Лот', 
    place: 'Место',
    price: 'Цена',
    delivery: 'Доставка',
    call: 'Позвонить',
    telegram: 'Telegram',
    noImage: 'Нет изображения',
  },
  
  bn: {
    // Loading states
    loadingProfile: 'প্রোফাইল লোড হচ্ছে...',
    
    // Error states
    errorAccess: 'অ্যাক্সেস ত্রুটি',
    profileNotFound: 'প্রোফাইল খুঁজে পাওয়া যায়নি',
    goToHome: 'হোমে যান',
    tokenNotFound: 'টোকেন পাওয়া যায়নি',
    invalidOrExpiredLink: 'অবৈধ বা মেয়াদোত্তীর্ণ লিঙ্ক',
    errorLoadingProducts: 'পণ্য লোড করতে ত্রুটি',
    dataLoadingError: 'ডেটা লোড করার সময় একটি ত্রুটি ঘটেছে',
    
    // Profile info
    autoPartsDealer: 'অটো পার্টস ডিলার',
    verified: 'যাচাইকৃত',
    rating: 'রেটিং',
    qualityAutoPartsCatalog: 'UAE-তে মানসম্পন্ন অটো পার্টস ক্যাটালগ',
    
    // Meta tags
    catalogTitle: (name: string) => `${name} - অটো পার্টস ক্যাটালগ | PartsBay`,
    catalogDescription: (name: string) => `${name} থেকে অটো পার্টস ক্যাটালগ। UAE-তে ডেলিভারি সহ মানসম্পন্ন পার্টস।`,
    
    // Products section
    products: (count: number) => `পণ্য (${count})`,
    noActiveProducts: 'এই বিক্রেতার এখনও কোনো সক্রিয় পণ্য নেই',
    viewAllProducts: 'সব পণ্য দেখুন',
    
    // Product card elements
    seller: 'বিক্রেতা',
    location: 'অবস্থান',
    lot: 'লট',
    place: 'স্থান',
    price: 'মূল্য',
    delivery: 'ডেলিভারি',
    call: 'কল করুন',
    telegram: 'টেলিগ্রাম',
    noImage: 'কোনো ছবি নেই',
  },
};

export const getPublicProfileTranslations = (language: Lang): PublicProfileTranslations => {
  return publicProfileTranslations[language] || publicProfileTranslations.en;
};