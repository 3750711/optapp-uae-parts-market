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
  
  // Auth alerts
  fullAccessRequiresRegistration: string;
  contactSellerDescription: string;
  loginRegister: string;
  goToSite: string;
  
  // Products section
  products: (count: number) => string;
  noActiveProducts: string;
  viewAllProducts: string;
  
  // Call to action
  wantToSeeMore: string;
  registerForAccess: string;
  joinPartsBay: string;
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
    
    // Auth alerts
    fullAccessRequiresRegistration: 'Full access requires registration',
    contactSellerDescription: 'To contact the seller and get contact information, you need to register on the site.',
    loginRegister: 'Login / Register',
    goToSite: 'Go to Site',
    
    // Products section
    products: (count: number) => `Products (${count})`,
    noActiveProducts: 'This seller has no active products yet',
    viewAllProducts: 'View all products',
    
    // Call to action
    wantToSeeMore: 'Want to see more products?',
    registerForAccess: 'Register for access to all site features',
    joinPartsBay: 'Join PartsBay',
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
    
    // Auth alerts
    fullAccessRequiresRegistration: 'Полный доступ требует регистрации',
    contactSellerDescription: 'Для связи с продавцом и получения контактной информации необходимо зарегистрироваться на сайте.',
    loginRegister: 'Войти / Регистрация',
    goToSite: 'Перейти на сайт',
    
    // Products section
    products: (count: number) => `Товары (${count})`,
    noActiveProducts: 'У этого продавца пока нет активных товаров',
    viewAllProducts: 'Посмотреть все товары',
    
    // Call to action
    wantToSeeMore: 'Хотите увидеть больше товаров?',
    registerForAccess: 'Зарегистрируйтесь для доступа ко всем функциям сайта',
    joinPartsBay: 'Присоединиться к PartsBay',
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
    
    // Auth alerts
    fullAccessRequiresRegistration: 'সম্পূর্ণ অ্যাক্সেসের জন্য নিবন্ধন প্রয়োজন',
    contactSellerDescription: 'বিক্রেতার সাথে যোগাযোগ এবং যোগাযোগের তথ্য পেতে সাইটে নিবন্ধন করতে হবে।',
    loginRegister: 'লগইন / নিবন্ধন',
    goToSite: 'সাইটে যান',
    
    // Products section
    products: (count: number) => `পণ্য (${count})`,
    noActiveProducts: 'এই বিক্রেতার এখনও কোনো সক্রিয় পণ্য নেই',
    viewAllProducts: 'সব পণ্য দেখুন',
    
    // Call to action
    wantToSeeMore: 'আরো পণ্য দেখতে চান?',
    registerForAccess: 'সাইটের সব ফিচারে অ্যাক্সেসের জন্য নিবন্ধন করুন',
    joinPartsBay: 'PartsBay-তে যোগ দিন',
  },
};

export const getPublicProfileTranslations = (language: Lang): PublicProfileTranslations => {
  return publicProfileTranslations[language] || publicProfileTranslations.en;
};