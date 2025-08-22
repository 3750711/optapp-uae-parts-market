// Translation constants for SellerOrders page
export type Lang = 'ru' | 'en' | 'bn';

const en = {
  // Page titles and headers
  pageTitle: "My Orders",
  pageDescription: "Manage created orders and listing orders",
  backToDashboard: "Back to Dashboard",

  // Search related
  searchPlaceholder: "Search by order number, lot, title, brand, model or seller opt_id...",
  searchButton: "Search",
  searchingButton: "Searching...",
  findButton: "Find",
  clearButton: "Clear",
  clearSearch: "Clear search",
  searchResultsFor: "Search results for:",
  totalOrders: "Total orders:",
  foundResults: "Found:",
  noResultsFound: "No results found for your search",

  // Order status labels
  statusLabels: {
    created: "Created",
    seller_confirmed: "Confirmed by Seller", 
    admin_confirmed: "Confirmed by Admin",
    processed: "Processed",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled"
  },

  // Order types
  orderTypes: {
    free_order: "Free Order",
    ads_order: "Listing Order"
  },

  // Order details
  lot: "Lot:",
  shippingPlaces: "Shipping places:",
  deliveryCost: "Delivery cost:",
  buyer: "Buyer",
  notSpecified: "Not specified", 
  additionalInformation: "Additional information:",

  // Action buttons
  confirmOrder: "Confirm",
  cancelOrder: "Cancel",
  confirmButton: "Confirm",
  cancelButton: "Cancel",

  // Toast messages
  orderConfirmed: "Order Confirmed",
  orderConfirmedDescription: "Order status successfully updated",
  orderCancelled: "Order Cancelled", 
  orderCancelledDescription: "Order status successfully updated",
  error: "Error",
  confirmOrderError: "Failed to confirm order",
  cancelOrderError: "Failed to cancel order",
  loadingOrdersError: "Error loading orders",

  // Dialog titles
  confirmOrderTitle: "Confirm Order",
  cancelOrderTitle: "Cancel Order",
  confirmOrderDescription: "Are you sure you want to confirm this order?",
  cancelOrderDescription: "Are you sure you want to cancel this order? This action cannot be undone.",

  // Empty states
  noOrders: "You don't have any orders yet",
  goToCatalog: "Go to Catalog",

  // Loading
  loading: "Loading..."
};

const ru = {
  // Page titles and headers
  pageTitle: "Мои заказы",
  pageDescription: "Управление созданными заказами и заказами объявлений",
  backToDashboard: "Назад к панели",

  // Search related
  searchPlaceholder: "Поиск по номеру заказа, лоту, названию, бренду, модели или opt_id продавца...",
  searchButton: "Поиск",
  searchingButton: "Поиск...",
  findButton: "Найти",
  clearButton: "Очистить",
  clearSearch: "Очистить поиск",
  searchResultsFor: "Результаты поиска для:",
  totalOrders: "Всего заказов:",
  foundResults: "Найдено:",
  noResultsFound: "Результатов по вашему запросу не найдено",

  // Order status labels
  statusLabels: {
    created: "Создан",
    seller_confirmed: "Подтвержден продавцом", 
    admin_confirmed: "Подтвержден админом",
    processed: "Обработан",
    shipped: "Отправлен",
    delivered: "Доставлен",
    cancelled: "Отменен"
  },

  // Order types
  orderTypes: {
    free_order: "Бесплатный заказ",
    ads_order: "Заказ объявления"
  },

  // Order details
  lot: "Лот:",
  shippingPlaces: "Места доставки:",
  deliveryCost: "Стоимость доставки:",
  buyer: "Покупатель",
  notSpecified: "Не указано", 
  additionalInformation: "Дополнительная информация:",

  // Action buttons
  confirmOrder: "Подтвердить",
  cancelOrder: "Отменить",
  confirmButton: "Подтвердить",
  cancelButton: "Отменить",

  // Toast messages
  orderConfirmed: "Заказ подтвержден",
  orderConfirmedDescription: "Статус заказа успешно обновлен",
  orderCancelled: "Заказ отменен", 
  orderCancelledDescription: "Статус заказа успешно обновлен",
  error: "Ошибка",
  confirmOrderError: "Не удалось подтвердить заказ",
  cancelOrderError: "Не удалось отменить заказ",
  loadingOrdersError: "Ошибка загрузки заказов",

  // Dialog titles
  confirmOrderTitle: "Подтвердить заказ",
  cancelOrderTitle: "Отменить заказ",
  confirmOrderDescription: "Вы уверены, что хотите подтвердить этот заказ?",
  cancelOrderDescription: "Вы уверены, что хотите отменить этот заказ? Это действие нельзя отменить.",

  // Empty states
  noOrders: "У вас пока нет заказов",
  goToCatalog: "Перейти в каталог",

  // Loading
  loading: "Загрузка..."
};

const bn = {
  // Page titles and headers
  pageTitle: "আমার অর্ডার",
  pageDescription: "তৈরি অর্ডার এবং তালিকা অর্ডার পরিচালনা করুন",
  backToDashboard: "ড্যাশবোর্ডে ফিরুন",

  // Search related
  searchPlaceholder: "অর্ডার নম্বর, লট, শিরোনাম, ব্র্যান্ড, মডেল বা বিক্রেতা opt_id দ্বারা অনুসন্ধান করুন...",
  searchButton: "অনুসন্ধান",
  searchingButton: "অনুসন্ধান করা হচ্ছে...",
  findButton: "খুঁজুন",
  clearButton: "পরিষ্কার",
  clearSearch: "অনুসন্ধান পরিষ্কার করুন",
  searchResultsFor: "অনুসন্ধানের ফলাফল:",
  totalOrders: "মোট অর্ডার:",
  foundResults: "পাওয়া গেছে:",
  noResultsFound: "আপনার অনুসন্ধানের জন্য কোন ফলাফল পাওয়া যায়নি",

  // Order status labels
  statusLabels: {
    created: "তৈরি",
    seller_confirmed: "বিক্রেতা দ্বারা নিশ্চিত", 
    admin_confirmed: "অ্যাডমিন দ্বারা নিশ্চিত",
    processed: "প্রক্রিয়াজাত",
    shipped: "পাঠানো হয়েছে",
    delivered: "সরবরাহ করা হয়েছে",
    cancelled: "বাতিল"
  },

  // Order types
  orderTypes: {
    free_order: "বিনামূল্যে অর্ডার",
    ads_order: "তালিকা অর্ডার"
  },

  // Order details
  lot: "লট:",
  shippingPlaces: "পাঠানোর স্থান:",
  deliveryCost: "ডেলিভারি খরচ:",
  buyer: "ক্রেতা",
  notSpecified: "নির্দিষ্ট নয়", 
  additionalInformation: "অতিরিক্ত তথ্য:",

  // Action buttons
  confirmOrder: "নিশ্চিত করুন",
  cancelOrder: "বাতিল",
  confirmButton: "নিশ্চিত করুন",
  cancelButton: "বাতিল",

  // Toast messages
  orderConfirmed: "অর্ডার নিশ্চিত",
  orderConfirmedDescription: "অর্ডারের অবস্থা সফলভাবে আপডেট হয়েছে",
  orderCancelled: "অর্ডার বাতিল", 
  orderCancelledDescription: "অর্ডারের অবস্থা সফলভাবে আপডেট হয়েছে",
  error: "ত্রুটি",
  confirmOrderError: "অর্ডার নিশ্চিত করতে ব্যর্থ",
  cancelOrderError: "অর্ডার বাতিল করতে ব্যর্থ",
  loadingOrdersError: "অর্ডার লোড করতে ত্রুটি",

  // Dialog titles
  confirmOrderTitle: "অর্ডার নিশ্চিত করুন",
  cancelOrderTitle: "অর্ডার বাতিল করুন",
  confirmOrderDescription: "আপনি কি নিশ্চিত যে আপনি এই অর্ডারটি নিশ্চিত করতে চান?",
  cancelOrderDescription: "আপনি কি নিশ্চিত যে আপনি এই অর্ডারটি বাতিল করতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।",

  // Empty states
  noOrders: "আপনার এখনও কোন অর্ডার নেই",
  goToCatalog: "ক্যাটালগে যান",

  // Loading
  loading: "লোড হচ্ছে..."
};

export const sellerOrdersTranslations: Record<Lang, typeof en> = { en, ru, bn };

export const getSellerOrdersTranslations = (lang: Lang) => sellerOrdersTranslations[lang];

export default getSellerOrdersTranslations;