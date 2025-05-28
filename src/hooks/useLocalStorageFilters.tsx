
import { useState, useEffect } from 'react';
import { SearchFilters } from '@/components/seller/EnhancedProductSearch';

const STORAGE_KEY = 'seller-sell-product-filters';

export const useLocalStorageFilters = () => {
  const [savedFilters, setSavedFilters] = useState<SearchFilters | null>(null);

  // Загружаем сохраненные фильтры при инициализации
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedFilters(parsed);
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  }, []);

  // Сохраняем фильтры в localStorage
  const saveFilters = (filters: SearchFilters) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
      setSavedFilters(filters);
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  };

  // Очищаем сохраненные фильтры
  const clearSavedFilters = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setSavedFilters(null);
    } catch (error) {
      console.error('Error clearing saved filters:', error);
    }
  };

  return {
    savedFilters,
    saveFilters,
    clearSavedFilters
  };
};
