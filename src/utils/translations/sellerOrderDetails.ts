import { Lang } from '@/types/i18n';

interface SellerOrderDetailsTranslations {
  // Page header
  orderDetails: string;
  orderNumber: string;
  
  // Product information section
  productInformation: string;
  productName: string;
  brand: string;
  model: string;
  description: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  deliveryCost: string;
  placesCount: string;
  
  // Buyer information section
  buyerInformation: string;
  buyerName: string;
  buyerTelegram: string;
  buyerOptId: string;
  
  // Order status section
  orderStatus: string;
  createdAt: string;
  updatedAt: string;
  
  // Status values
  statuses: {
    created: string;
    pending: string;
    seller_confirmed: string;
    admin_confirmed: string;
    confirmed: string;
    processed: string;
    shipped: string;
    delivered: string;
    cancelled: string;
  };
  
  // Container statuses
  containerStatuses: {
    waiting: string;
    in_transit: string;
    delivered: string;
    customs: string;
  };
  
  // Container types
  containerTypes: {
    '20ft': string;
    '40ft': string;
    '40hc': string;
    lcl: string;
  };
  
  // Shipping methods
  shippingMethods: {
    sea: string;
    air: string;
    land: string;
  };
  
  // Media
  mediaFiles: string;
  photos: string;
  videos: string;
  files: string;
  open: string;
  
  // Delivery
  deliveryInformation: string;
  deliveryMethod: string;
  containerNumber: string;
  containerStatus: string;
  
  // Other
  selfOrder: string;
  notSpecified: string;
  accessDenied: string;
  checkingAccess: string;
  error: string;
  
  // Actions
  editOrder: string;
  deleteOrder: string;
  confirmOrder: string;
  
  // Error messages
  orderNotFound: string;
  loadingOrder: string;
  errorLoadingOrder: string;
}

const ru: SellerOrderDetailsTranslations = {
  orderDetails: 'Детали заказа',
  orderNumber: 'Номер заказа',
  
  productInformation: 'Информация о товаре',
  productName: 'Название товара',
  brand: 'Бренд',
  model: 'Модель',
  description: 'Описание',
  quantity: 'Количество',
  unitPrice: 'Цена за единицу',
  totalPrice: 'Общая стоимость',
  deliveryCost: 'Стоимость доставки',
  placesCount: 'Количество мест',
  
  buyerInformation: 'Информация о покупателе',
  buyerName: 'Имя покупателя',
  buyerTelegram: 'Telegram покупателя',
  buyerOptId: 'OPT ID покупателя',
  
  orderStatus: 'Статус заказа',
  createdAt: 'Создан',
  updatedAt: 'Обновлен',
  
  statuses: {
    created: 'Создан',
    pending: 'В ожидании',
    seller_confirmed: 'Подтвержден продавцом',
    admin_confirmed: 'Подтвержден администратором',
    confirmed: 'Подтвержден',
    processed: 'В обработке',
    shipped: 'Отправлен',
    delivered: 'Доставлен',
    cancelled: 'Отменен',
  },
  
  containerStatuses: {
    waiting: 'Ожидание',
    in_transit: 'В пути',
    delivered: 'Доставлен',
    customs: 'На таможне',
  },
  
  containerTypes: {
    '20ft': '20-футовый контейнер',
    '40ft': '40-футовый контейнер',
    '40hc': '40-футовый HC контейнер',
    lcl: 'LCL (сборный груз)',
  },
  
  shippingMethods: {
    sea: 'Морской',
    air: 'Авиа',
    land: 'Наземный',
  },
  
  mediaFiles: 'Медиафайлы',
  photos: 'Фотографии',
  videos: 'Видео',
  files: 'файлов',
  open: 'Открыть',
  
  deliveryInformation: 'Доставка',
  deliveryMethod: 'Способ доставки',
  containerNumber: 'Номер контейнера',
  containerStatus: 'Статус контейнера',
  
  selfOrder: 'Самозаказ',
  notSpecified: 'Не указан',
  accessDenied: 'Доступ запрещен',
  checkingAccess: 'Проверка прав доступа...',
  error: 'Ошибка',
  
  editOrder: 'Редактировать заказ',
  deleteOrder: 'Удалить заказ',
  confirmOrder: 'Подтвердить заказ',
  
  orderNotFound: 'Заказ не найден',
  loadingOrder: 'Загрузка заказа...',
  errorLoadingOrder: 'Ошибка загрузки заказа',
};

const en: SellerOrderDetailsTranslations = {
  orderDetails: 'Order Details',
  orderNumber: 'Order Number',
  
  productInformation: 'Product Information',
  productName: 'Product Name',
  brand: 'Brand',
  model: 'Model',
  description: 'Description',
  quantity: 'Quantity',
  unitPrice: 'Unit Price',
  totalPrice: 'Total Price',
  deliveryCost: 'Delivery Cost',
  placesCount: 'Places Count',
  
  buyerInformation: 'Buyer Information',
  buyerName: 'Buyer Name',
  buyerTelegram: 'Buyer Telegram',
  buyerOptId: 'Buyer OPT ID',
  
  orderStatus: 'Order Status',
  createdAt: 'Created At',
  updatedAt: 'Updated At',
  
  statuses: {
    created: 'Created',
    pending: 'Pending',
    seller_confirmed: 'Seller Confirmed',
    admin_confirmed: 'Admin Confirmed',
    confirmed: 'Confirmed',
    processed: 'Processed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  },
  
  containerStatuses: {
    waiting: 'Waiting',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    customs: 'Customs',
  },
  
  containerTypes: {
    '20ft': '20ft Container',
    '40ft': '40ft Container',
    '40hc': '40ft HC Container',
    lcl: 'LCL (Less Container Load)',
  },
  
  shippingMethods: {
    sea: 'Sea',
    air: 'Air',
    land: 'Land',
  },
  
  mediaFiles: 'Media Files',
  photos: 'Photos',
  videos: 'Videos',
  files: 'files',
  open: 'Open',
  
  deliveryInformation: 'Delivery',
  deliveryMethod: 'Delivery Method',
  containerNumber: 'Container Number',
  containerStatus: 'Container Status',
  
  selfOrder: 'Self Order',
  notSpecified: 'Not specified',
  accessDenied: 'Access denied',
  checkingAccess: 'Checking access...',
  error: 'Error',
  
  editOrder: 'Edit Order',
  deleteOrder: 'Delete Order',
  confirmOrder: 'Confirm Order',
  
  orderNotFound: 'Order not found',
  loadingOrder: 'Loading order...',
  errorLoadingOrder: 'Error loading order',
};

const bn: SellerOrderDetailsTranslations = {
  orderDetails: 'অর্ডারের বিস্তারিত',
  orderNumber: 'অর্ডার নম্বর',
  
  productInformation: 'পণ্যের তথ্য',
  productName: 'পণ্যের নাম',
  brand: 'ব্র্যান্ড',
  model: 'মডেল',
  description: 'বর্ণনা',
  quantity: 'পরিমাণ',
  unitPrice: 'একক মূল্য',
  totalPrice: 'মোট মূল্য',
  deliveryCost: 'ডেলিভারি খরচ',
  placesCount: 'স্থানের সংখ্যা',
  
  buyerInformation: 'ক্রেতার তথ্য',
  buyerName: 'ক্রেতার নাম',
  buyerTelegram: 'ক্রেতার টেলিগ্রাম',
  buyerOptId: 'ক্রেতার OPT ID',
  
  orderStatus: 'অর্ডারের অবস্থা',
  createdAt: 'তৈরি হয়েছে',
  updatedAt: 'আপডেট হয়েছে',
  
  statuses: {
    created: 'তৈরি',
    pending: 'অপেক্ষমাণ',
    seller_confirmed: 'বিক্রেতা নিশ্চিত',
    admin_confirmed: 'অ্যাডমিন নিশ্চিত',
    confirmed: 'নিশ্চিত',
    processed: 'প্রক্রিয়াকরণ',
    shipped: 'পাঠানো হয়েছে',
    delivered: 'বিতরণ করা হয়েছে',
    cancelled: 'বাতিল',
  },
  
  containerStatuses: {
    waiting: 'অপেক্ষা',
    in_transit: 'পরিবহনে',
    delivered: 'বিতরণ',
    customs: 'শুল্ক',
  },
  
  containerTypes: {
    '20ft': '২০ ফুট কন্টেইনার',
    '40ft': '৪০ ফুট কন্টেইনার',
    '40hc': '৪০ ফুট HC কন্টেইনার',
    lcl: 'LCL (কম কন্টেইনার লোড)',
  },
  
  shippingMethods: {
    sea: 'সমুদ্র',
    air: 'বিমান',
    land: 'ভূমি',
  },
  
  mediaFiles: 'মিডিয়া ফাইল',
  photos: 'ছবি',
  videos: 'ভিডিও',
  files: 'ফাইল',
  open: 'খুলুন',
  
  deliveryInformation: 'ডেলিভারি',
  deliveryMethod: 'ডেলিভারি পদ্ধতি',
  containerNumber: 'কন্টেইনার নম্বর',
  containerStatus: 'কন্টেইনার অবস্থা',
  
  selfOrder: 'নিজের অর্ডার',
  notSpecified: 'নির্দিষ্ট নয়',
  accessDenied: 'প্রবেশাধিকার নেই',
  checkingAccess: 'অ্যাক্সেস পরীক্ষা...',
  error: 'ত্রুটি',
  
  editOrder: 'অর্ডার সম্পাদনা',
  deleteOrder: 'অর্ডার মুছুন',
  confirmOrder: 'অর্ডার নিশ্চিত করুন',
  
  orderNotFound: 'অর্ডার পাওয়া যায়নি',
  loadingOrder: 'অর্ডার লোড হচ্ছে...',
  errorLoadingOrder: 'অর্ডার লোড করতে ত্রুটি',
};

export const sellerOrderDetailsTranslations: Record<Lang, SellerOrderDetailsTranslations> = {
  ru,
  en,
  bn,
};

export const getSellerOrderDetailsTranslations = (lang: Lang): SellerOrderDetailsTranslations => {
  return sellerOrderDetailsTranslations[lang] || sellerOrderDetailsTranslations.en;
};

export default getSellerOrderDetailsTranslations;