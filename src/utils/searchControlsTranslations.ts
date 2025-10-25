import { Lang } from '@/types/i18n';
import { tPick } from '@/utils/i18n';

export interface SearchControlsTranslations {
  searchPlaceholder: string;
  clearButton: string;
  hideSoldCheckbox: string;
  activeFilter: string;
  clearSearchLabel: string;
  showSoldLabel: string;
  clearAllFiltersLabel: string;
  clearAll: string;
  clear: string;
}

const translations: Record<Lang, SearchControlsTranslations> = {
  ru: {
    searchPlaceholder: 'Поиск товаров...',
    clearButton: 'Очистить',
    hideSoldCheckbox: 'Скрыть проданные',
    activeFilter: 'Активные',
    clearSearchLabel: 'Удалить поисковый запрос',
    showSoldLabel: 'Показать проданные товары',
    clearAllFiltersLabel: 'Очистить все фильтры',
    clearAll: 'Очистить все',
    clear: 'Очистить',
  },
  en: {
    searchPlaceholder: 'Search products...',
    clearButton: 'Clear',
    hideSoldCheckbox: 'Hide sold',
    activeFilter: 'Active',
    clearSearchLabel: 'Remove search query',
    showSoldLabel: 'Show sold products',
    clearAllFiltersLabel: 'Clear all filters',
    clearAll: 'Clear all',
    clear: 'Clear',
  },
  bn: {
    searchPlaceholder: 'পণ্য অনুসন্ধান করুন...',
    clearButton: 'পরিষ্কার',
    hideSoldCheckbox: 'বিক্রিত লুকান',
    activeFilter: 'সক্রিয়',
    clearSearchLabel: 'অনুসন্ধান মুছুন',
    showSoldLabel: 'বিক্রিত পণ্য দেখান',
    clearAllFiltersLabel: 'সব ফিল্টার সাফ করুন',
    clearAll: 'সব সাফ করুন',
    clear: 'পরিষ্কার',
  },
};

export const getSearchControlsTranslations = (lang: Lang): SearchControlsTranslations => {
  return tPick(translations, lang, 'en');
};
