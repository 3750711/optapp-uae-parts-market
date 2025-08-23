import { Lang } from '@/types/i18n';

export interface SellerListingsPageTranslations {
  // Page headers
  myShop: string;
  back: string;
  retry: string;
  
  // Search functionality
  searchPlaceholder: string;
  search: string;
  searchByLotPlace: string;
  textSearch: string;
  
  // Product listing
  showingResults: string;
  of: string;
  products: string;
  
  // Pagination
  previous: string;
  next: string;
  page: string;
  
  // Empty states
  noListingsYet: string;
  createFirstListing: string;
  
  // Error messages
  errorLoadingProducts: string;
  checkConnection: string;
  
  // Status updates
  statusUpdated: string;
  changesApplied: string;
  updatingData: string;
  loadingProducts: string;
  failedToUpdate: string;
  
  // Meta tags
  metaTitle: string;
  metaDescription: string;

  // Filters
  filters?: {
    title: string;
    sortBy: string;
    byDate: string;
    byPrice: string;
  };

  // Error Boundary
  errorBoundary: {
    title: string;
    errorOccurred: string;
    unknownError: string;
    refreshPage: string;
  };
}

const ru: SellerListingsPageTranslations = {
  // Page headers
  myShop: 'Мой МАГАЗИН',
  back: 'Назад',
  retry: 'Повторить',
  
  // Search functionality
  searchPlaceholder: 'Поиск по названию, бренду, модели или номеру лота/места...',
  search: 'Поиск',
  searchByLotPlace: 'Поиск по номеру лота/места',
  textSearch: 'Текстовый поиск',
  
  // Product listing
  showingResults: 'Показано',
  of: 'из',
  products: 'товаров',
  
  // Pagination
  previous: 'Предыдущая',
  next: 'Следующая',
  page: 'Страница',
  
  // Empty states
  noListingsYet: 'У вас еще нет товаров',
  createFirstListing: 'Создайте свое первое объявление, чтобы начать продавать',
  
  // Error messages
  errorLoadingProducts: 'Ошибка загрузки товаров',
  checkConnection: 'Проверьте подключение к интернету и попробуйте снова',
  
  // Status updates
  statusUpdated: 'Статус обновлен',
  changesApplied: 'Изменения применены',
  updatingData: 'Обновление данных',
  loadingProducts: 'Загрузка ваших товаров...',
  failedToUpdate: 'Не удалось обновить данные',
  
  // Meta tags
  metaTitle: 'Товары продавца | Ожидающие первыми',
  metaDescription: 'Управляйте своими товарами. Ожидающие модерации товары отображаются первыми.',

  // Filters
  filters: {
    title: 'Фильтры',
    sortBy: 'Сортировка',
    byDate: 'По дате',
    byPrice: 'По цене'
  },

  // Error Boundary
  errorBoundary: {
    title: 'Мой МАГАЗИН',
    errorOccurred: 'Произошла ошибка',
    unknownError: 'Неизвестная ошибка при загрузке страницы',
    refreshPage: 'Обновить страницу'
  }
};

const en: SellerListingsPageTranslations = {
  // Page headers
  myShop: 'My SHOP',
  back: 'Back',
  retry: 'Retry',
  
  // Search functionality
  searchPlaceholder: 'Search by title, brand, model or lot/place number...',
  search: 'Search',
  searchByLotPlace: 'Search by lot/place number',
  textSearch: 'Text search',
  
  // Product listing
  showingResults: 'Showing',
  of: 'of',
  products: 'products',
  
  // Pagination
  previous: 'Previous',
  next: 'Next',
  page: 'Page',
  
  // Empty states
  noListingsYet: "You don't have any listings yet",
  createFirstListing: 'Create your first listing to start selling',
  
  // Error messages
  errorLoadingProducts: 'Error loading products',
  checkConnection: 'Check your internet connection and try again',
  
  // Status updates
  statusUpdated: 'Status updated',
  changesApplied: 'Changes applied',
  updatingData: 'Updating data',
  loadingProducts: 'Loading your products...',
  failedToUpdate: 'Failed to update data',
  
  // Meta tags
  metaTitle: 'Seller Listings | Pending first',
  metaDescription: 'Manage your listings. Pending (moderation) items appear first.',

  // Filters
  filters: {
    title: 'Filters',
    sortBy: 'Sort by',
    byDate: 'By Date',
    byPrice: 'By Price'
  },

  // Error Boundary
  errorBoundary: {
    title: 'My SHOP',
    errorOccurred: 'An error occurred',
    unknownError: 'Unknown error while loading page',
    refreshPage: 'Refresh Page'
  }
};

const bn: SellerListingsPageTranslations = {
  // Page headers
  myShop: 'আমার দোকান',
  back: 'ফিরে যান',
  retry: 'পুনরায় চেষ্টা',
  
  // Search functionality
  searchPlaceholder: 'শিরোনাম, ব্র্যান্ড, মডেল বা লট/স্থান নম্বর দিয়ে অনুসন্ধান...',
  search: 'অনুসন্ধান',
  searchByLotPlace: 'লট/স্থান নম্বর দিয়ে অনুসন্ধান',
  textSearch: 'টেক্সট অনুসন্ধান',
  
  // Product listing
  showingResults: 'দেখানো হচ্ছে',
  of: 'এর মধ্যে',
  products: 'পণ্য',
  
  // Pagination
  previous: 'পূর্ববর্তী',
  next: 'পরবর্তী',
  page: 'পৃষ্ঠা',
  
  // Empty states
  noListingsYet: 'আপনার এখনও কোন পণ্য নেই',
  createFirstListing: 'বিক্রয় শুরু করতে আপনার প্রথম তালিকা তৈরি করুন',
  
  // Error messages
  errorLoadingProducts: 'পণ্য লোড করতে ত্রুটি',
  checkConnection: 'আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন এবং আবার চেষ্টা করুন',
  
  // Status updates
  statusUpdated: 'স্ট্যাটাস আপডেট হয়েছে',
  changesApplied: 'পরিবর্তন প্রয়োগ করা হয়েছে',
  updatingData: 'ডেটা আপডেট হচ্ছে',
  loadingProducts: 'আপনার পণ্য লোড হচ্ছে...',
  failedToUpdate: 'ডেটা আপডেট করতে ব্যর্থ',
  
  // Meta tags
  metaTitle: 'বিক্রেতার তালিকা | অপেক্ষমাণ প্রথম',
  metaDescription: 'আপনার তালিকা পরিচালনা করুন। অপেক্ষমাণ (মডারেশন) আইটেম প্রথমে প্রদর্শিত হয়।',

  // Filters
  filters: {
    title: 'ফিল্টার',
    sortBy: 'সাজান',
    byDate: 'তারিখ অনুযায়ী',
    byPrice: 'দামের অনুযায়ী'
  },

  // Error Boundary
  errorBoundary: {
    title: 'আমার দোকান',
    errorOccurred: 'একটি ত্রুটি ঘটেছে',
    unknownError: 'পৃষ্ঠা লোড করার সময় অজানা ত্রুটি',
    refreshPage: 'পৃষ্ঠা রিফ্রেশ করুন'
  }
};

export const sellerListingsPageTranslations: Record<Lang, SellerListingsPageTranslations> = {
  ru,
  en,
  bn
};

export const getSellerListingsPageTranslations = (lang: Lang): SellerListingsPageTranslations => {
  return sellerListingsPageTranslations[lang] || sellerListingsPageTranslations.en;
};

export default getSellerListingsPageTranslations;