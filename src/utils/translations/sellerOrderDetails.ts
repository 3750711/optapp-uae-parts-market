import { Lang } from '@/types/i18n';

interface SellerOrderDetailsTranslations {
  // Page header
  orderDetails: string;
  orderNumber: string;
  
  // Product information section
  productInformation: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  
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
    pending: string;
    confirmed: string;
    shipped: string;
    delivered: string;
    cancelled: string;
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
  quantity: 'Количество',
  unitPrice: 'Цена за единицу',
  totalPrice: 'Общая стоимость',
  
  buyerInformation: 'Информация о покупателе',
  buyerName: 'Имя покупателя',
  buyerTelegram: 'Telegram покупателя',
  buyerOptId: 'OPT ID покупателя',
  
  orderStatus: 'Статус заказа',
  createdAt: 'Создан',
  updatedAt: 'Обновлен',
  
  statuses: {
    pending: 'В ожидании',
    confirmed: 'Подтвержден',
    shipped: 'Отправлен',
    delivered: 'Доставлен',
    cancelled: 'Отменен',
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
  quantity: 'Quantity',
  unitPrice: 'Unit Price',
  totalPrice: 'Total Price',
  
  buyerInformation: 'Buyer Information',
  buyerName: 'Buyer Name',
  buyerTelegram: 'Buyer Telegram',
  buyerOptId: 'Buyer OPT ID',
  
  orderStatus: 'Order Status',
  createdAt: 'Created At',
  updatedAt: 'Updated At',
  
  statuses: {
    pending: 'Pending',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
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
  quantity: 'পরিমাণ',
  unitPrice: 'একক মূল্য',
  totalPrice: 'মোট মূল্য',
  
  buyerInformation: 'ক্রেতার তথ্য',
  buyerName: 'ক্রেতার নাম',
  buyerTelegram: 'ক্রেতার টেলিগ্রাম',
  buyerOptId: 'ক্রেতার OPT ID',
  
  orderStatus: 'অর্ডারের অবস্থা',
  createdAt: 'তৈরি হয়েছে',
  updatedAt: 'আপডেট হয়েছে',
  
  statuses: {
    pending: 'অপেক্ষমাণ',
    confirmed: 'নিশ্চিত',
    shipped: 'পাঠানো হয়েছে',
    delivered: 'বিতরণ করা হয়েছে',
    cancelled: 'বাতিল',
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