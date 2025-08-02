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
}

const translations: Record<'ru' | 'en', MainPageTranslations> = {
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
      description: 'Закрытое профессиональное сообщество поставщиков и покупателей автозапчастей в ОАЭ',
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
      description: 'Closed professional community of auto parts suppliers and buyers in UAE',
      accessTitle: 'Access by registration only',
      accessDescription: 'Authorization required to access the platform',
    },
    statistics: {
      partsListed: 'Auto parts listed',
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
  },
};

export const getMainPageTranslations = (language: 'ru' | 'en' = 'ru'): MainPageTranslations => {
  return translations[language];
};