// Common translations used across multiple components
import { Lang } from '@/types/i18n';

export type CommonLang = Lang;

const en = {
  // Common buttons
  buttons: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    search: 'Search',
    clear: 'Clear',
    loading: 'Loading...',
    submit: 'Submit',
    create: 'Create',
    update: 'Update',
    remove: 'Remove',
    backToDashboard: 'Back to Dashboard',
    backToOrders: 'Back to Orders',
    retry: 'Retry',
    refresh: 'Refresh',
    register: 'Register',
    hide: 'Hide',
    restore: 'Restore',
    apply: 'Apply',
    select: 'Select',
    share: 'Share'
  },

  // Share functionality
  share: {
    shareStore: 'Share Store',
    shareProfile: 'Share Profile',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    email: 'Email',
    copyLink: 'Copy Link',
    shareVia: 'Share via',
    linkCopied: 'Link copied!',
    shareNotAvailable: 'Sharing not available',
    messageCopied: 'Message copied! Paste it in the app',
    failedToCopy: 'Failed to copy message'
  },

  // Common statuses
  statuses: {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed',
    cancelled: 'Cancelled',
    error: 'Error',
    success: 'Success'
  },

  // Common menu items
  menu: {
    home: 'Home',
    profile: 'Profile',
    settings: 'Settings',
    help: 'Help',
    about: 'About',
    contact: 'Contact',
    logout: 'Sign out',
    login: 'Sign in',
    register: 'Register'
  },

  // Common messages
  messages: {
    noData: 'No data available',
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Operation completed successfully',
    confirmDelete: 'Are you sure you want to delete this item?',
    unsavedChanges: 'You have unsaved changes',
    networkError: 'Network connection error',
    unauthorized: 'You are not authorized to perform this action',
    noPhoto: 'No Photo',
    productAlreadySold: 'Unfortunately, this product has already been sold',
    productStatusCheckError: 'Failed to check product availability',
    noProductsAvailable: 'No products available'
  },

  // Common sections
  sections: {
    latestProducts: 'Latest Products',
    management: 'Management',
    viewAll: 'View All'
  },

  // Common errors
  errors: {
    title: 'Error',
    accessDenied: 'Access denied'
  },

  // Common fields
  fields: {
    price: 'Price',
    currentStatus: 'Current Status',
    preferredLanguage: 'Preferred Language'
  },

  // Language names
  languages: {
    ru: 'Russian',
    en: 'English',
    bn: 'Bengali'
  },

  // Product fields
  product: {
    brand: 'Brand',
    model: 'Model',
    lotNumber: 'Lot Number',
    notSpecified: 'Not specified'
  }
};

const ru = {
  // Common buttons
  buttons: {
    save: 'Сохранить',
    cancel: 'Отменить',
    delete: 'Удалить',
    edit: 'Редактировать',
    confirm: 'Подтвердить',
    close: 'Закрыть',
    back: 'Назад',
    next: 'Далее',
    previous: 'Предыдущий',
    search: 'Поиск',
    clear: 'Очистить',
    loading: 'Загрузка...',
    submit: 'Отправить',
    create: 'Создать',
    update: 'Обновить',
    remove: 'Удалить',
    backToDashboard: 'Назад к дашборду',
    backToOrders: 'Назад к заказам',
    retry: 'Повторить',
    refresh: 'Обновить',
    register: 'Зарегистрироваться',
    hide: 'Скрыть',
    restore: 'Восстановить',
    apply: 'Применить',
    select: 'Выбрать',
    share: 'Поделиться'
  },

  // Share functionality
  share: {
    shareStore: 'Поделиться магазином',
    shareProfile: 'Поделиться профилем',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    email: 'Email',
    copyLink: 'Скопировать ссылку',
    shareVia: 'Поделиться через',
    linkCopied: 'Ссылка скопирована!',
    shareNotAvailable: 'Поделиться недоступно',
    messageCopied: 'Сообщение скопировано! Вставьте его в приложение',
    failedToCopy: 'Не удалось скопировать сообщение'
  },

  // Common statuses
  statuses: {
    active: 'Активный',
    inactive: 'Неактивный',
    pending: 'Ожидание',
    approved: 'Одобрено',
    rejected: 'Отклонено',
    completed: 'Завершено',
    cancelled: 'Отменено',
    error: 'Ошибка',
    success: 'Успех'
  },

  // Common menu items
  menu: {
    home: 'Главная',
    profile: 'Профиль',
    settings: 'Настройки',
    help: 'Помощь',
    about: 'О нас',
    contact: 'Контакты',
    logout: 'Выйти',
    login: 'Войти',
    register: 'Регистрация'
  },

  // Common messages
  messages: {
    noData: 'Данные отсутствуют',
    loading: 'Загрузка...',
    error: 'Произошла ошибка',
    success: 'Операция выполнена успешно',
    confirmDelete: 'Вы уверены, что хотите удалить этот элемент?',
    unsavedChanges: 'У вас есть несохраненные изменения',
    networkError: 'Ошибка сетевого подключения',
    unauthorized: 'У вас нет прав для выполнения этого действия',
    noPhoto: 'Нет фото',
    productAlreadySold: 'К сожалению, товар уже продан',
    productStatusCheckError: 'Не удалось проверить доступность товара',
    noProductsAvailable: 'Нет доступных товаров'
  },

  // Common sections
  sections: {
    latestProducts: 'Последние товары',
    management: 'Управление',
    viewAll: 'Посмотреть все'
  },

  // Common errors
  errors: {
    title: 'Ошибка',
    accessDenied: 'Доступ запрещен'
  },

  // Common fields
  fields: {
    price: 'Цена',
    currentStatus: 'Текущий статус',
    preferredLanguage: 'Предпочитаемый язык'
  },

  // Language names
  languages: {
    ru: 'Русский',
    en: 'Английский',
    bn: 'Бенгальский'
  },

  // Product fields
  product: {
    brand: 'Бренд',
    model: 'Модель',
    lotNumber: 'Номер лота',
    notSpecified: 'Не указан'
  }
};

const bn = {
  // Common buttons
  buttons: {
    save: 'সংরক্ষণ',
    cancel: 'বাতিল',
    delete: 'মুছুন',
    edit: 'সম্পাদনা',
    confirm: 'নিশ্চিত করুন',
    close: 'বন্ধ',
    back: 'পিছনে',
    next: 'পরবর্তী',
    previous: 'আগের',
    search: 'অনুসন্ধান',
    clear: 'পরিষ্কার',
    loading: 'লোড হচ্ছে...',
    submit: 'জমা দিন',
    create: 'তৈরি করুন',
    update: 'আপডেট',
    remove: 'সরান',
    backToDashboard: 'ড্যাশবোর্ডে ফিরুন',
    backToOrders: 'অর্ডারে ফিরুন',
    retry: 'পুনরায় চেষ্টা করুন',
    refresh: 'রিফ্রেশ',
    register: 'রেজিস্টার করুন',
    hide: 'লুকান',
    restore: 'পুনরুদ্ধার',
    apply: 'প্রয়োগ করুন',
    select: 'নির্বাচন করুন',
    share: 'শেয়ার করুন'
  },

  // Share functionality
  share: {
    shareStore: 'দোকান শেয়ার করুন',
    shareProfile: 'প্রোফাইল শেয়ার করুন',
    whatsapp: 'হোয়াটসঅ্যাপ',
    telegram: 'টেলিগ্রাম',
    email: 'ইমেইল',
    copyLink: 'লিংক কপি করুন',
    shareVia: 'এর মাধ্যমে শেয়ার করুন',
    linkCopied: 'লিংক কপি হয়েছে!',
    shareNotAvailable: 'শেয়ার করা উপলব্ধ নেই',
    messageCopied: 'বার্তা কপি হয়েছে! অ্যাপে পেস্ট করুন',
    failedToCopy: 'বার্তা কপি করতে ব্যর্থ হয়েছে'
  },

  // Common statuses
  statuses: {
    active: 'সক্রিয়',
    inactive: 'নিষ্ক্রিয়',
    pending: 'মুলতুবি',
    approved: 'অনুমোদিত',
    rejected: 'প্রত্যাখ্যাত',
    completed: 'সম্পন্ন',
    cancelled: 'বাতিল',
    error: 'ত্রুটি',
    success: 'সফল'
  },

  // Common menu items
  menu: {
    home: 'হোম',
    profile: 'প্রোফাইল',
    settings: 'সেটিংস',
    help: 'সহায়তা',
    about: 'সম্পর্কে',
    contact: 'যোগাযোগ',
    logout: 'সাইন আউট',
    login: 'সাইন ইন',
    register: 'নিবন্ধন'
  },

  // Common messages
  messages: {
    noData: 'কোন ডেটা উপলব্ধ নেই',
    loading: 'লোড হচ্ছে...',
    error: 'একটি ত্রুটি ঘটেছে',
    success: 'অপারেশন সফলভাবে সম্পন্ন হয়েছে',
    confirmDelete: 'আপনি কি নিশ্চিত যে আপনি এই আইটেমটি মুছতে চান?',
    unsavedChanges: 'আপনার অসংরক্ষিত পরিবর্তন আছে',
    networkError: 'নেটওয়ার্ক সংযোগ ত্রুটি',
    unauthorized: 'এই কাজটি সম্পাদন করার জন্য আপনার অনুমতি নেই',
    noPhoto: 'কোন ছবি নেই',
    productAlreadySold: 'দুঃখিত, এই পণ্যটি ইতিমধ্যে বিক্রি হয়ে গেছে',
    productStatusCheckError: 'পণ্যের উপলব্ধতা যাচাই করতে ব্যর্থ হয়েছে',
    noProductsAvailable: 'কোন পণ্য উপলব্ধ নেই'
  },

  // Common sections
  sections: {
    latestProducts: 'সর্বশেষ পণ্য',
    management: 'ব্যবস্থাপনা',
    viewAll: 'সব দেখুন'
  },

  // Common errors
  errors: {
    title: 'ত্রুটি',
    accessDenied: 'প্রবেশ নিষিদ্ধ'
  },

  // Common fields
  fields: {
    price: 'মূল্য',
    currentStatus: 'বর্তমান অবস্থা',
    preferredLanguage: 'পছন্দের ভাষা'
  },

  // Language names
  languages: {
    ru: 'রাশিয়ান',
    en: 'ইংরেজি',
    bn: 'বাংলা'
  },

  // Product fields
  product: {
    brand: 'ব্র্যান্ড',
    model: 'মডেল',
    lotNumber: 'লট নাম্বার',
    notSpecified: 'নির্দিষ্ট নয়'
  }
};

export const commonTranslations: Record<CommonLang, typeof en> = { en, ru, bn };

export const getCommonTranslations = (lang: CommonLang) => commonTranslations[lang];

export default getCommonTranslations;