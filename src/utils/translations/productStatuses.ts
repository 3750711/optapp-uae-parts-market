export interface ProductStatusTranslations {
  statuses: {
    active: string;
    sold: string;
    archived: string;
    pending: string;
    unknown: string;
  };
  offerStatuses: {
    pending: string;
    accepted: string;
    rejected: string;
    expired: string;
    cancelled: string;
  };
  labels: {
    priceOffers: string;
    noOffersYet: string;
    total: string;
    maxPrice: string;
    avgPrice: string;
    newOffers: string;
    allOffers: string;
    productInformation: string;
    price: string;
    numberOfPlaces: string;
    deliveryPrice: string;
    views: string;
    created: string;
    productDescription: string;
    places: string;
    tgViews: string;
    totalOffers: string;
    waitingResponse: string;
    latestOffers: string;
    from: string;
    viewAll: string;
  };
  stats: {
    totalProducts: string;
    pending: string;
    sold: string;
    totalOrders: string;
    activeOrders: string;
    totalRevenue: string;
    thisMonth: string;
    averageOrder: string;
    active: string;
    productsInReview: string;
    productsTotal: string;
    completed: string;
    inProgress: string;
    allTime: string;
    orders: string;
    perOrder: string;
    statistics: string;
    lastUpdated: string;
    errorLoading: string;
    retry: string;
  };
  dialogs: {
    hideProduct: {
      title: string;
      description: string;
    };
    markSold: {
      title: string;
      description: string;
    };
  };
  markSoldDialog: {
    title: string;
    description: string;
    cancel: string;
    confirm: string;
    processing: string;
    successMessage: string;
    errorMessage: string;
  };
  actions: {
    markSold: string;
    markSoldShort: string;
    archive: string;
    restore: string;
    edit: string;
    viewOffers: string;
    share: string;
  };
}

export const getProductStatusTranslations = (language: 'ru' | 'en' | 'bn'): ProductStatusTranslations => {
  const translations: Record<string, ProductStatusTranslations> = {
    ru: {
      statuses: {
        active: "Активный",
        sold: "Продан",
        archived: "В архиве",
        pending: "На рассмотрении",
        unknown: "Неизвестно"
      },
      offerStatuses: {
        pending: "В работе",
        accepted: "Принято",
        rejected: "Отклонено",
        expired: "Истекло",
        cancelled: "Отменено"
      },
      labels: {
        priceOffers: "Предложения цен",
        noOffersYet: "Пока нет предложений",
        total: "Всего",
        maxPrice: "Макс. цена",
        avgPrice: "Средняя цена",
        newOffers: "новых",
        allOffers: "Все предложения",
        productInformation: "Информация о товаре",
        price: "Цена",
        numberOfPlaces: "Количество мест",
        deliveryPrice: "Стоимость доставки",
        views: "Просмотры",
        tgViews: "TG просмотры",
        created: "Создан",
        productDescription: "Описание товара",
        places: "Места",
        totalOffers: "Всего предложений",
        waitingResponse: "Ожидают ответа",
        latestOffers: "Последние предложения:",
        from: "от",
        viewAll: "Просмотреть все"
      },
      stats: {
        totalProducts: "Всего товаров",
        pending: "На модерации",
        sold: "Продано",
        totalOrders: "Всего заказов",
        activeOrders: "Активные заказы",
        totalRevenue: "Общая выручка",
        thisMonth: "За этот месяц",
        averageOrder: "Средний заказ",
        active: "активных",
        productsInReview: "товаров на проверке",
        productsTotal: "товаров всего",
        completed: "завершено",
        inProgress: "в процессе",
        allTime: "за все время",
        orders: "заказов",
        perOrder: "за заказ",
        statistics: "Статистика",
        lastUpdated: "Обновлено",
        errorLoading: "Ошибка загрузки статистики",
        retry: "Попробовать снова"
      },
      dialogs: {
        hideProduct: {
          title: "Скрыть объявление?",
          description: "Объявление будет помещено в архив и не будет отображаться в поиске. Вы сможете восстановить его позже."
        },
        markSold: {
          title: "Отметить как проданное?",
          description: "Объявление будет помечено как проданное и убрано из активных объявлений."
        }
      },
      markSoldDialog: {
        title: "Подтвердить действие",
        description: "Вы уверены, что хотите отметить товар как проданный? Это действие нельзя отменить.",
        cancel: "Отмена",
        confirm: "Подтвердить",
        processing: "Обработка...",
        successMessage: "Статус товара успешно изменен на 'Продан'",
        errorMessage: "Ошибка при изменении статуса товара"
      },
      actions: {
        markSold: "Отметить проданным",
        markSoldShort: "Продан",
        archive: "В архив",
        restore: "Восстановить",
        edit: "Редактировать",
        viewOffers: "Посмотреть предложения",
        share: "Поделиться"
      }
    },
    en: {
      statuses: {
        active: "Active",
        sold: "Sold",
        archived: "Archived",
        pending: "Pending",
        unknown: "Unknown"
      },
      offerStatuses: {
        pending: "Pending",
        accepted: "Accepted",
        rejected: "Rejected",
        expired: "Expired",
        cancelled: "Cancelled"
      },
      labels: {
        priceOffers: "Price Offers",
        noOffersYet: "No price offers yet",
        total: "Total",
        maxPrice: "Max Price",
        avgPrice: "Avg Price",
        newOffers: "new",
        allOffers: "All Offers",
        productInformation: "Product Information",
        price: "Price",
        numberOfPlaces: "Number of Places",
        deliveryPrice: "Delivery Price",
        views: "Views",
        tgViews: "TG Views",
        created: "Created",
        productDescription: "Product Description",
        places: "Places",
        totalOffers: "Total Offers",
        waitingResponse: "Waiting Response",
        latestOffers: "Latest offers:",
        from: "from",
        viewAll: "View All"
      },
      stats: {
        totalProducts: "Total Products",
        pending: "Pending",
        sold: "Sold",
        totalOrders: "Total Orders",
        activeOrders: "Active Orders",
        totalRevenue: "Total Revenue",
        thisMonth: "This Month",
        averageOrder: "Average Order",
        active: "active",
        productsInReview: "products in review",
        productsTotal: "products total",
        completed: "completed",
        inProgress: "in progress",
        allTime: "all time",
        orders: "orders",
        perOrder: "per order",
        statistics: "Statistics",
        lastUpdated: "Last updated",
        errorLoading: "Error loading statistics",
        retry: "Try again"
      },
      dialogs: {
        hideProduct: {
          title: "Hide listing?",
          description: "The listing will be archived and will not appear in search results. You can restore it later."
        },
        markSold: {
          title: "Mark as sold?",
          description: "The listing will be marked as sold and removed from active listings."
        }
      },
      markSoldDialog: {
        title: "Confirm Action",
        description: "Are you sure you want to mark this product as sold? This action cannot be undone.",
        cancel: "Cancel",
        confirm: "Confirm",
        processing: "Processing...",
        successMessage: "Product status successfully changed to 'Sold'",
        errorMessage: "Error changing product status"
      },
      actions: {
        markSold: "Mark Sold",
        markSoldShort: "Sold",
        archive: "Archive",
        restore: "Restore",
        edit: "Edit",
        viewOffers: "View Offers",
        share: "Share"
      }
    },
    bn: {
      statuses: {
        active: "সক্রিয়",
        sold: "বিক্রিত",
        archived: "সংরক্ষণাগারে",
        pending: "অপেক্ষমাণ",
        unknown: "অজানা"
      },
      offerStatuses: {
        pending: "অপেক্ষমাণ",
        accepted: "গৃহীত",
        rejected: "প্রত্যাখ্যাত",
        expired: "মেয়াদ শেষ",
        cancelled: "বাতিল"
      },
      labels: {
        priceOffers: "মূল্য প্রস্তাব",
        noOffersYet: "এখনো কোনো মূল্য প্রস্তাব নেই",
        total: "মোট",
        maxPrice: "সর্বোচ্চ মূল্য",
        avgPrice: "গড় মূল্য",
        newOffers: "নতুন",
        allOffers: "সব প্রস্তাব",
        productInformation: "পণ্যের তথ্য",
        price: "মূল্য",
        numberOfPlaces: "স্থানের সংখ্যা",
        deliveryPrice: "ডেলিভারি খরচ",
        views: "দেখা হয়েছে",
        tgViews: "TG ভিউ",
        created: "তৈরি",
        productDescription: "পণ্যের বিবরণ",
        places: "স্থান",
        totalOffers: "মোট অফার",
        waitingResponse: "প্রতিক্রিয়ার অপেক্ষায়",
        latestOffers: "সাম্প্রতিক অফার:",
        from: "থেকে",
        viewAll: "সব দেখুন"
      },
      stats: {
        totalProducts: "মোট পণ্য",
        pending: "অপেক্ষমান",
        sold: "বিক্রিত",
        totalOrders: "মোট অর্ডার",
        activeOrders: "সক্রিয় অর্ডার",
        totalRevenue: "মোট আয়",
        thisMonth: "এই মাসে",
        averageOrder: "গড় অর্ডার",
        active: "সক্রিয়",
        productsInReview: "পণ্য পর্যালোচনায়",
        productsTotal: "মোট পণ্য",
        completed: "সম্পন্ন",
        inProgress: "চলমান",
        allTime: "সকল সময়",
        orders: "অর্ডার",
        perOrder: "প্রতি অর্ডার",
        statistics: "পরিসংখ্যান",
        lastUpdated: "শেষ আপডেট",
        errorLoading: "পরিসংখ্যান লোড করতে ত্রুটি",
        retry: "আবার চেষ্টা করুন"
      },
      dialogs: {
        hideProduct: {
          title: "তালিকা লুকান?",
          description: "তালিকাটি আর্কাইভ করা হবে এবং অনুসন্ধান ফলাফলে দেখা যাবে না। আপনি পরে এটি পুনরুদ্ধার করতে পারেন।"
        },
        markSold: {
          title: "বিক্রিত হিসেবে চিহ্নিত করুন?",
          description: "তালিকাটি বিক্রিত হিসেবে চিহ্নিত হবে এবং সক্রিয় তালিকা থেকে সরানো হবে।"
        }
      },
      markSoldDialog: {
        title: "কর্ম নিশ্চিত করুন",
        description: "আপনি কি নিশ্চিত যে এই পণ্যটি বিক্রিত হিসেবে চিহ্নিত করতে চান? এই কর্মটি পূর্বাবস্থায় ফেরানো যাবে না।",
        cancel: "বাতিল",
        confirm: "নিশ্চিত করুন",
        processing: "প্রক্রিয়াকরণ...",
        successMessage: "পণ্যের অবস্থা সফলভাবে 'বিক্রিত' এ পরিবর্তিত হয়েছে",
        errorMessage: "পণ্যের অবস্থা পরিবর্তনে ত্রুটি"
      },
      actions: {
        markSold: "বিক্রিত চিহ্নিত করুন",
        markSoldShort: "বিক্রিত",
        archive: "সংরক্ষণাগার",
        restore: "পুনরুদ্ধার",
        edit: "সম্পাদনা",
        viewOffers: "অফারগুলি দেখুন",
        share: "শেয়ার করুন"
      }
    }
  };

  return translations[language] || translations.ru;
};