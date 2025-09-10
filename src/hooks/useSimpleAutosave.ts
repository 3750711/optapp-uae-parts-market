import { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from '@/utils/debounce';
import { simplifiedPWAManager } from '@/utils/simplifiedPWAManager';

interface SimpleAutosaveOptions {
  key: string;
  data: any;
  delay?: number;
  enabled?: boolean;
  onSave?: () => void;
  onRestore?: (data: any) => void;
}

// Simplified autosave hook - replacing complex PWA-optimized version
export const useSimpleAutosave = ({
  key,
  data,
  delay = 2000,
  enabled = true,
  onSave,
  onRestore
}: SimpleAutosaveOptions) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const lastSavedData = useRef<string>('');
  const isFirstRender = useRef(true);

  // Simple save function without PWA complexity
  const saveToStorage = useCallback((dataToSave: any) => {
    if (!enabled) return;

    try {
      const serializedData = JSON.stringify(dataToSave);
      
      if (serializedData === lastSavedData.current) {
        return;
      }

      localStorage.setItem(`autosave_${key}`, serializedData);
      localStorage.setItem(`autosave_${key}_timestamp`, Date.now().toString());
      lastSavedData.current = serializedData;
      setHasUnsavedChanges(false);
      onSave?.();
    } catch (error) {
      console.error('💾 Autosave error:', error);
    }
  }, [key, enabled, onSave]);

  // Simple debounced save
  const debouncedSave = useCallback(
    debounce(saveToStorage, delay),
    [saveToStorage, delay]
  );

  // Immediate save
  const saveNow = useCallback((overrideData?: any) => {
    if (!enabled) return;
    
    debouncedSave.cancel();
    const dataToSave = overrideData || data;
    saveToStorage(dataToSave);
  }, [enabled, data, saveToStorage, debouncedSave]);

  // Auto-save when data changes - simplified logic
  useEffect(() => {
    if (!enabled || isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const currentData = JSON.stringify(data);
    if (currentData !== lastSavedData.current) {
      setHasUnsavedChanges(true);
      debouncedSave(data);
    }
  }, [data, enabled, debouncedSave]);

  // Register with simplified PWA manager
  useEffect(() => {
    if (!enabled) return;
    
    return simplifiedPWAManager.register(`autosave-${key}`, {
      onVisibilityChange: (isHidden: boolean) => {
        if (isHidden && hasUnsavedChanges) {
          saveNow();
        }
      },
      onPageHide: () => {
        if (hasUnsavedChanges) {
          saveNow();
        }
      },
      onBlur: () => {
        if (hasUnsavedChanges) {
          saveNow();
        }
      }
    });
  }, [key, enabled, saveNow, hasUnsavedChanges]);

  // Load saved data - simplified
  const loadSavedData = useCallback(() => {
    try {
      const savedData = localStorage.getItem(`autosave_${key}`);
      const timestamp = localStorage.getItem(`autosave_${key}_timestamp`);
      
      if (savedData && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (age < maxAge) {
          const parsedData = JSON.parse(savedData);
          lastSavedData.current = savedData;
          onRestore?.(parsedData);
          return parsedData;
        }
      }
      return null;
    } catch (error) {
      console.error('💾 Load autosave error:', error);
      return null;
    }
  }, [key, onRestore]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(`autosave_${key}`);
      localStorage.removeItem(`autosave_${key}_timestamp`);
      lastSavedData.current = '';
      setHasUnsavedChanges(false);
      debouncedSave.cancel();
    } catch (error) {
      console.error('💾 Clear autosave error:', error);
    }
  }, [key, debouncedSave]);

  // Cleanup
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  return {
    loadSavedData,
    clearSavedData,
    saveNow,
    hasUnsavedChanges,
    isPWAMode: simplifiedPWAManager.shouldOptimizeForPWA()
  };
};