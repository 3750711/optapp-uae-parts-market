
import { useEffect, useCallback } from 'react';
import { OrderFormData, AutoSaveData } from '@/components/admin/order/types';
import { useDebounceValue } from './useDebounceValue';

const AUTO_SAVE_KEY = 'admin_order_draft';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export const useAutoSave = (
  formData: OrderFormData,
  images: string[],
  videos: string[]
) => {
  const debouncedFormData = useDebounceValue(formData, 2000);

  const saveToStorage = useCallback((data: AutoSaveData) => {
    try {
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(data));
      console.log('📝 Form auto-saved to localStorage');
    } catch (error) {
      console.error('Failed to auto-save form:', error);
    }
  }, []);

  const loadFromStorage = useCallback((): AutoSaveData | null => {
    try {
      const saved = localStorage.getItem(AUTO_SAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as AutoSaveData;
        // Only return if saved within last 24 hours
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      console.error('Failed to load auto-saved form:', error);
    }
    return null;
  }, []);

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(AUTO_SAVE_KEY);
      console.log('🗑️ Auto-saved form cleared');
    } catch (error) {
      console.error('Failed to clear auto-saved form:', error);
    }
  }, []);

  // Auto-save when form data changes
  useEffect(() => {
    if (debouncedFormData.title || debouncedFormData.price || images.length > 0) {
      const autoSaveData: AutoSaveData = {
        formData: debouncedFormData,
        images,
        videos,
        timestamp: Date.now()
      };
      saveToStorage(autoSaveData);
    }
  }, [debouncedFormData, images, videos, saveToStorage]);

  return {
    loadFromStorage,
    clearStorage
  };
};
