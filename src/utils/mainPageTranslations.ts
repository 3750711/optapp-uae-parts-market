interface MainPageTranslations {
  // Header translations
  header: {
    home: string;
    catalog: string;
    stores: string;
    requests: string;
    about: string;
  };
  
  // Hero section
  hero: {
    title: string;
    subtitle: string;
    description: string;
    accessTitle: string;
    accessDescription: string;
  };
  
  // Statistics
  statistics: {
    partsListed: string;
    ordersCreated: string;
  };
  
  // Welcome section for authenticated users
  welcome: {
    greeting: string;
    sellerDescription: string;
    buyerDescription: string;
    sellerButton: string;
    buyerButton: string;
  };
  
  // Meta tags
  meta: {
    title: string;
    description: string;
    keywords: string;
  };
  
  // Stats block
  stats: {
    partsCount: string;
    ordersCount: string;
    platformTitle: string;
    platformSubtitle: string;
    trustedSellers: string;
    buyerReviews: string;
    cargoDelivery: string;
    qualityCheck: string;
  };
  
  // Error messages
  errors: {
    pageLoadError: string;
    pageLoadErrorDesc: string;
    catalogLoadError: string;
    productsLoadError: string;
    productsFoundLabel: string;
    refreshPage: string;
    tryAgain: string;
  };
}

const translations: Record<'ru' | 'en' | 'bn', MainPageTranslations> = {
  ru: {
    header: {
      home: 'Главная',
      catalog: 'Каталог',
      stores: 'Магазины',
      requests: 'Запросы',
      about: 'О нас',
    },
    hero: {
      title: 'PartsBay.ae',
      subtitle: 'B2B/B2C Платформа Автозапчастей',
      description: 'Присоединяйтесь к крупнейшей платформе автозапчастей в ОАЭ. Проверенные продавцы, честные аукционы и надежная логистика — все в одном месте.',
      accessTitle: 'Доступ только по регистрации',
      accessDescription: 'Для доступа к платформе необходимо пройти авторизацию',
    },
    statistics: {
      partsListed: 'Автозапчастей размещено',
      ordersCreated: 'Заказов создано',
    },
    welcome: {
      greeting: 'Добро пожаловать',
      sellerDescription: 'Управляйте своими автозапчастями и заказами',
      buyerDescription: 'Просматривайте каталог автозапчастей',
      sellerButton: 'Панель управления',
      buyerButton: 'Открыть каталог',
    },
    meta: {
      title: 'PartsBay.ae - B2B/B2C Платформа Автозапчастей',
      description: 'Закрытая профессиональная платформа автозапчастей в ОАЭ. Доступ только для зарегистрированных пользователей.',
      keywords: 'B2B автозапчасти ОАЭ, платформа автозапчастей, закрытое сообщество',
    },
    stats: {
      partsCount: 'Автозапчастей',
      ordersCount: 'Заказов создано',
      platformTitle: 'PartsBay.ae',
      platformSubtitle: 'Легко найти запчасти в ОАЭ',
      trustedSellers: 'Проверенные продавцы',
      buyerReviews: 'Отзывы покупателей',
      cargoDelivery: 'Cargo доставка',
      qualityCheck: 'Проверка качества',
    },
    errors: {
      pageLoadError: 'Ошибка загрузки страницы',
      pageLoadErrorDesc: 'Произошла ошибка при загрузке главной страницы',
      catalogLoadError: 'Ошибка загрузки каталога',
      productsLoadError: 'Произошла ошибка при загрузке товаров',
      productsFoundLabel: 'Найдено товаров:',
      refreshPage: 'Обновить страницу',
      tryAgain: 'Попробовать снова',
    },
  },
  en: {
    header: {
      home: 'Home',
      catalog: 'Catalog',
      stores: 'Stores',
      requests: 'Requests',
      about: 'About',
    },
    hero: {
      title: 'PartsBay.ae',
      subtitle: 'B2B/B2C Auto Parts Platform',
      description: 'Join the largest UAE platform for auto parts. Verified sellers, fair auctions, and trusted logistics — all in one place.',
      accessTitle: 'Access by registration only',
      accessDescription: 'Authorization required to access the platform',
    },
    statistics: {
      partsListed: 'Auto parts active lots',
      ordersCreated: 'Orders created',
    },
    welcome: {
      greeting: 'Welcome',
      sellerDescription: 'Manage your auto parts and orders',
      buyerDescription: 'Browse the auto parts catalog',
      sellerButton: 'Dashboard',
      buyerButton: 'Open catalog',
    },
    meta: {
      title: 'PartsBay.ae - B2B/B2C Auto Parts Platform',
      description: 'Closed professional auto parts platform in UAE. Access only for registered users.',
      keywords: 'B2B auto parts UAE, auto parts platform, closed community',
    },
    stats: {
      partsCount: 'Auto parts',
      ordersCount: 'Orders created',
      platformTitle: 'PartsBay.ae',
      platformSubtitle: 'Easy to find parts in UAE',
      trustedSellers: 'Verified sellers',
      buyerReviews: 'Buyer reviews',
      cargoDelivery: 'Cargo delivery',
      qualityCheck: 'Quality check',
    },
    errors: {
      pageLoadError: 'Page load error',
      pageLoadErrorDesc: 'An error occurred while loading the main page',
      catalogLoadError: 'Catalog load error',
      productsLoadError: 'An error occurred while loading products',
      productsFoundLabel: 'Products found:',
      refreshPage: 'Refresh page',
      tryAgain: 'Try again',
    },
  },
  bn: {
    header: {
      home: 'হোম',
      catalog: 'ক্যাটালগ',
      stores: 'দোকান',
      requests: 'অনুরোধ',
      about: 'আমাদের সম্পর্কে',
    },
    hero: {
      title: 'PartsBay.ae',
      subtitle: 'B2B/B2C গাড়ির যন্ত্রাংশের প্ল্যাটফর্ম',
      description: 'UAE-তে সবচেয়ে বড় গাড়ির যন্ত্রাংশের প্ল্যাটফর্মে যোগ দিন। যাচাইকৃত বিক্রেতা, ন্যায্য নিলাম এবং বিশ্বস্ত লজিস্টিক্স — সব এক জায়গায়।',
      accessTitle: 'শুধুমাত্র নিবন্ধনের মাধ্যমে প্রবেশ',
      accessDescription: 'প্ল্যাটফর্ম অ্যাক্সেস করতে অনুমোদন প্রয়োজন',
    },
    statistics: {
      partsListed: 'সক্রিয় গাড়ির যন্ত্রাংশ',
      ordersCreated: 'অর্ডার তৈরি',
    },
    welcome: {
      greeting: 'স্বাগতম',
      sellerDescription: 'আপনার গাড়ির যন্ত্রাংশ এবং অর্ডার পরিচালনা করুন',
      buyerDescription: 'গাড়ির যন্ত্রাংশের ক্যাটালগ ব্রাউজ করুন',
      sellerButton: 'ড্যাশবোর্ড',
      buyerButton: 'ক্যাটালগ খুলুন',
    },
    meta: {
      title: 'PartsBay.ae - B2B/B2C গাড়ির যন্ত্রাংশের প্ল্যাটফর্ম',
      description: 'UAE-তে বন্ধ পেশাদার গাড়ির যন্ত্রাংশের প্ল্যাটফর্ম। শুধুমাত্র নিবন্ধিত ব্যবহারকারীদের জন্য প্রবেশাধিকার।',
      keywords: 'B2B গাড়ির যন্ত্রাংশ UAE, গাড়ির যন্ত্রাংশের প্ল্যাটফর্ম, বন্ধ কমিউনিটি',
    },
    stats: {
      partsCount: 'অটো পার্টস',
      ordersCount: 'অর্ডার তৈরি',
      platformTitle: 'PartsBay.ae',
      platformSubtitle: 'UAE-তে যন্ত্রাংশ খুঁজে পাওয়া সহজ',
      trustedSellers: 'যাচাইকৃত বিক্রেতা',
      buyerReviews: 'ক্রেতার পর্যালোচনা',
      cargoDelivery: 'কার্গো ডেলিভারি',
      qualityCheck: 'গুণমান পরীক্ষা',
    },
    errors: {
      pageLoadError: 'পৃষ্ঠা লোড ত্রুটি',
      pageLoadErrorDesc: 'প্রধান পৃষ্ঠা লোড করার সময় একটি ত্রুটি ঘটেছে',
      catalogLoadError: 'ক্যাটালগ লোড ত্রুটি',
      productsLoadError: 'পণ্য লোড করার সময় একটি ত্রুটি ঘটেছে',
      productsFoundLabel: 'পণ্য পাওয়া গেছে:',
      refreshPage: 'পৃষ্ঠা রিফ্রেশ করুন',
      tryAgain: 'আবার চেষ্টা করুন',
    },
  },
};

export const getMainPageTranslations = (language: 'ru' | 'en' | 'bn' = 'ru'): MainPageTranslations => {
  return translations[language];
};