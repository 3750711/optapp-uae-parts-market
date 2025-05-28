
import { useEffect, useCallback } from 'react';
import { useDebounceSearch } from './useDebounceSearch';

interface UseFormAutosaveOptions {
  key: string;
  data: any;
  enabled?: boolean;
  delay?: number;
}

export const useFormAutosave = ({ 
  key, 
  data, 
  enabled = true, 
  delay = 1000 
}: UseFormAutosaveOptions) => {
  const debouncedData = useDebounceSearch(JSON.stringify(data), delay);

  const saveToStorage = useCallback((dataToSave: any) => {
    try {
      localStorage.setItem(`autosave_${key}`, JSON.stringify({
        data: dataToSave,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to save form data:', error);
    }
  }, [key]);

  const loadFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(`autosave_${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Проверяем, что данные не старше 24 часов
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.data;
        }
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
    }
    return null;
  }, [key]);

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(`autosave_${key}`);
    } catch (error) {
      console.error('Failed to clear form data:', error);
    }
  }, [key]);

  useEffect(() => {
    if (enabled && debouncedData) {
      const parsedData = JSON.parse(debouncedData);
      // Не сохраняем пустые формы
      const hasContent = Object.values(parsedData).some(value => 
        typeof value === 'string' ? value.trim() : Boolean(value)
      );
      
      if (hasContent) {
        saveToStorage(parsedData);
      }
    }
  }, [debouncedData, enabled, saveToStorage]);

  return {
    loadFromStorage,
    clearStorage
  };
};
