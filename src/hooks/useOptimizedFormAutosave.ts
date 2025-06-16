
import { useEffect, useCallback, useRef, useState } from 'react';
import { debounce } from '@/utils/debounce';
import { useToast } from '@/hooks/use-toast';

interface OptimizedAutosaveOptions {
  key: string;
  data: any;
  delay?: number;
  enabled?: boolean;
  excludeFields?: string[];
}

export const useOptimizedFormAutosave = ({ 
  key, 
  data, 
  delay = 3000, 
  enabled = true,
  excludeFields = ['imageUrls', 'videoUrls', 'primaryImage']
}: OptimizedAutosaveOptions) => {
  const { toast } = useToast();
  const hasUnsavedChanges = useRef(false);
  const lastSavedData = useRef<string>('');
  const [draftExists, setDraftExists] = useState(false);

  const filterDataForSave = useCallback((dataToFilter: any) => {
    if (!dataToFilter || typeof dataToFilter !== 'object') return dataToFilter;
    
    const filtered = { ...dataToFilter };
    excludeFields.forEach(field => {
      delete filtered[field];
    });
    
    return filtered;
  }, [excludeFields]);

  const debouncedSave = useCallback(
    debounce((dataToSave: any) => {
      try {
        const filteredData = filterDataForSave(dataToSave);
        const serializedData = JSON.stringify(filteredData);
        
        if (serializedData !== lastSavedData.current) {
          localStorage.setItem(`autosave_${key}`, serializedData);
          localStorage.setItem(`autosave_${key}_timestamp`, Date.now().toString());
          hasUnsavedChanges.current = false;
          lastSavedData.current = serializedData;
          console.log(`✅ Form autosaved for key: ${key}`);
        }
      } catch (error) {
        console.error('Error saving form data:', error);
      }
    }, delay),
    [key, delay, filterDataForSave]
  );

  useEffect(() => {
    if (!enabled) return;

    const filteredData = filterDataForSave(data);
    const currentData = JSON.stringify(filteredData);
    
    if (currentData !== lastSavedData.current && Object.keys(filteredData).some(key => filteredData[key])) {
      hasUnsavedChanges.current = true;
      debouncedSave(data);
    }
  }, [data, debouncedSave, enabled, filterDataForSave]);

  const loadSavedData = useCallback(() => {
    try {
      const savedData = localStorage.getItem(`autosave_${key}`);
      const timestamp = localStorage.getItem(`autosave_${key}_timestamp`);
      
      if (savedData && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < 24 * 60 * 60 * 1000) {
          const parsedData = JSON.parse(savedData);
          setDraftExists(true);
          return parsedData;
        }
      }
      setDraftExists(false);
      return null;
    } catch (error) {
      console.error('Error loading saved form data:', error);
      setDraftExists(false);
      return null;
    }
  }, [key]);

  const clearSavedData = useCallback(() => {
    localStorage.removeItem(`autosave_${key}`);
    localStorage.removeItem(`autosave_${key}_timestamp`);
    hasUnsavedChanges.current = false;
    setDraftExists(false);
    
    toast({
      title: "Черновик очищен",
      description: "Сохраненный черновик был удален",
    });
  }, [key, toast]);

  const checkDraftExists = useCallback(() => {
    const savedData = localStorage.getItem(`autosave_${key}`);
    const timestamp = localStorage.getItem(`autosave_${key}_timestamp`);
    
    if (savedData && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      const exists = age < 24 * 60 * 60 * 1000;
      setDraftExists(exists);
      return exists;
    }
    
    setDraftExists(false);
    return false;
  }, [key]);

  useEffect(() => {
    checkDraftExists();
  }, [checkDraftExists]);

  return {
    loadSavedData,
    clearSavedData,
    hasUnsavedChanges: hasUnsavedChanges.current,
    draftExists,
    checkDraftExists
  };
};
