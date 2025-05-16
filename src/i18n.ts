
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Импортируем файлы переводов
import commonRu from './locales/ru/common.json';
import commonEn from './locales/en/common.json';
import adminRu from './locales/ru/admin.json';
import adminEn from './locales/en/admin.json';
import orderRu from './locales/ru/order.json';
import orderEn from './locales/en/order.json';

// Типы для объявления ресурсов
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      common: typeof commonRu;
      admin: typeof adminRu;
      order: typeof orderRu;
    };
  }
}

// Инициализация i18next
i18n
  .use(LanguageDetector) // Используем детектор языка для автоматического определения
  .use(initReactI18next) // Передаем i18n в react-i18next
  .init({
    resources: {
      ru: {
        common: commonRu,
        admin: adminRu,
        order: orderRu
      },
      en: {
        common: commonEn,
        admin: adminEn,
        order: orderEn
      }
    },
    lng: localStorage.getItem('language') || 'ru', // Язык по умолчанию
    fallbackLng: 'ru', // Запасной язык, если перевод отсутствует
    interpolation: {
      escapeValue: false, // Не экранировать HTML в переводах
    },
    ns: ['common', 'admin', 'order'], // Пространства имен
    defaultNS: 'common', // Пространство имен по умолчанию
    react: {
      useSuspense: true, // Использование React Suspense для загрузки переводов
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
