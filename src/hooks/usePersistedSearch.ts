
import { useState, useEffect, useCallback } from 'react';

interface UsePersistedSearchProps {
  key: string;
  defaultValue?: string;
}

export const usePersistedSearch = ({ key, defaultValue = '' }: UsePersistedSearchProps) => {
  const [searchTerm, setSearchTerm] = useState(defaultValue);

  // Загружаем сохраненное значение при инициализации
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`search_${key}`);
      if (saved) {
        setSearchTerm(saved);
      }
    } catch (error) {
      console.error('Error loading persisted search:', error);
    }
  }, [key]);

  // Сохраняем значение в localStorage
  const updateSearchTerm = useCallback((value: string) => {
    setSearchTerm(value);
    try {
      if (value) {
        localStorage.setItem(`search_${key}`, value);
      } else {
        localStorage.removeItem(`search_${key}`);
      }
    } catch (error) {
      console.error('Error saving search term:', error);
    }
  }, [key]);

  const clearSearchTerm = useCallback(() => {
    setSearchTerm('');
    try {
      localStorage.removeItem(`search_${key}`);
    } catch (error) {
      console.error('Error clearing search term:', error);
    }
  }, [key]);

  return {
    searchTerm,
    setSearchTerm: updateSearchTerm,
    clearSearchTerm
  };
};
