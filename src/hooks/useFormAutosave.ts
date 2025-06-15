
import { useEffect, useCallback, useRef } from 'react';
import { debounce } from '@/utils/debounce';

interface AutosaveOptions {
  key: string;
  data: any;
  delay?: number;
  enabled?: boolean;
}

export const useFormAutosave = ({ key, data, delay = 30000, enabled = true }: AutosaveOptions) => {
  const hasUnsavedChanges = useRef(false);
  const lastSavedData = useRef<string>('');

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((dataToSave: any) => {
      try {
        const serializedData = JSON.stringify(dataToSave);
        localStorage.setItem(`autosave_${key}`, serializedData);
        localStorage.setItem(`autosave_${key}_timestamp`, Date.now().toString());
        hasUnsavedChanges.current = false;
        lastSavedData.current = serializedData;
        console.log(`Form autosaved for key: ${key}`);
      } catch (error) {
        console.error('Error saving form data:', error);
      }
    }, delay),
    [key, delay]
  );

  // Save data when it changes
  useEffect(() => {
    if (!enabled) return;

    const currentData = JSON.stringify(data);
    if (currentData !== lastSavedData.current) {
      hasUnsavedChanges.current = true;
      debouncedSave(data);
    }
  }, [data, debouncedSave, enabled]);

  // Load saved data
  const loadSavedData = useCallback(() => {
    try {
      const savedData = localStorage.getItem(`autosave_${key}`);
      const timestamp = localStorage.getItem(`autosave_${key}_timestamp`);
      
      if (savedData && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        // Only load data if it's less than 24 hours old
        if (age < 24 * 60 * 60 * 1000) {
          return JSON.parse(savedData);
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading saved form data:', error);
      return null;
    }
  }, [key]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    localStorage.removeItem(`autosave_${key}`);
    localStorage.removeItem(`autosave_${key}_timestamp`);
    hasUnsavedChanges.current = false;
  }, [key]);

  // Warning before leaving page
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current) {
        event.preventDefault();
        event.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled]);

  return {
    loadSavedData,
    clearSavedData,
    hasUnsavedChanges: hasUnsavedChanges.current
  };
};
