import { useEffect, useCallback, useRef, useState } from 'react';
import { debounce } from '@/utils/debounce';
import { useToast } from '@/hooks/use-toast';

interface EnhancedMobileAutosaveOptions {
  key: string;
  data: any;
  delay?: number;
  enabled?: boolean;
  excludeFields?: string[];
  mobileOptimized?: boolean;
}

export const useEnhancedMobileAutosave = ({ 
  key, 
  data, 
  delay = 2000, 
  enabled = true,
  excludeFields = [],
  mobileOptimized = true
}: EnhancedMobileAutosaveOptions) => {
  const { toast } = useToast();
  const hasUnsavedChanges = useRef(false);
  const lastSavedData = useRef<string>('');
  const [draftExists, setDraftExists] = useState(false);
  const isVisible = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const filterDataForSave = useCallback((dataToFilter: any) => {
    if (!dataToFilter || typeof dataToFilter !== 'object') return dataToFilter;
    
    const filtered = { ...dataToFilter };
    excludeFields.forEach(field => {
      delete filtered[field];
    });
    
    return filtered;
  }, [excludeFields]);

  // Enhanced save function with mobile optimizations
  const performSave = useCallback((dataToSave: any, immediate = false) => {
    try {
      const filteredData = filterDataForSave(dataToSave);
      const serializedData = JSON.stringify(filteredData);
      
      if (serializedData !== lastSavedData.current) {
        // For mobile browsers, use sessionStorage as backup
        if (mobileOptimized) {
          try {
            sessionStorage.setItem(`mobile_backup_${key}`, serializedData);
          } catch (e) {
            console.warn('SessionStorage backup failed:', e);
          }
        }
        
        localStorage.setItem(`autosave_${key}`, serializedData);
        localStorage.setItem(`autosave_${key}_timestamp`, Date.now().toString());
        localStorage.setItem(`autosave_${key}_visibility`, isVisible.current ? 'visible' : 'hidden');
        
        hasUnsavedChanges.current = false;
        lastSavedData.current = serializedData;
        
        console.log(`💾 ${immediate ? 'Immediate' : 'Delayed'} save completed for: ${key}`);
      }
    } catch (error) {
      console.error('Error saving form data:', error);
      
      // Show user-friendly error for mobile users
      if (mobileOptimized) {
        toast({
          title: "Предупреждение",
          description: "Не удалось сохранить черновик. Не закрывайте приложение.",
          variant: "destructive",
        });
      }
    }
  }, [key, filterDataForSave, mobileOptimized, toast]);

  // Debounced save for normal operations
  const debouncedSave = useCallback(
    debounce((dataToSave: any) => performSave(dataToSave, false), delay),
    [performSave, delay]
  );

  // Immediate save for critical events (mobile focus/blur, visibility changes)
  const saveNow = useCallback((overrideData?: any) => {
    const dataToSave = overrideData ?? data;
    performSave(dataToSave, true);
  }, [performSave, data]);

  // Enhanced visibility tracking for mobile
  useEffect(() => {
    if (!enabled || !mobileOptimized) return;

    const handleVisibilityChange = () => {
      const nowVisible = document.visibilityState === 'visible';
      isVisible.current = nowVisible;
      
      if (!nowVisible) {
        // Page is being hidden - save immediately
        console.log('📱 Page hidden - triggering immediate save');
        saveNow();
      } else {
        // Page is visible again - check for any updates needed
        console.log('📱 Page visible - checking for restoration needs');
      }
    };

    const handlePageHide = () => {
      console.log('📱 Page hide event - critical save');
      saveNow();
    };

    const handleBeforeUnload = () => {
      console.log('📱 Before unload - final save attempt');
      saveNow();
    };

    const handleFocus = () => {
      console.log('📱 Window focused');
      isVisible.current = true;
    };

    const handleBlur = () => {
      console.log('📱 Window blurred - saving state');
      isVisible.current = false;
      saveNow();
    };

    // Mobile-specific events
    const handleTouchStart = () => {
      // User is interacting - ensure we save soon if needed
      if (hasUnsavedChanges.current && saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => saveNow(), 1000);
      }
    };

    const handleOrientationChange = () => {
      console.log('📱 Orientation change - saving state');
      saveNow();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('orientationchange', handleOrientationChange);
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [enabled, mobileOptimized, saveNow]);

  // Normal autosave trigger
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
      let savedData = localStorage.getItem(`autosave_${key}`);
      let timestamp = localStorage.getItem(`autosave_${key}_timestamp`);
      
      // If localStorage fails, try sessionStorage backup for mobile
      if (!savedData && mobileOptimized) {
        savedData = sessionStorage.getItem(`mobile_backup_${key}`);
        if (savedData) {
          console.log('📱 Using mobile backup from sessionStorage');
          timestamp = Date.now().toString(); // Current time as fallback
        }
      }
      
      if (savedData && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < 24 * 60 * 60 * 1000) { // 24 hours
          const parsedData = JSON.parse(savedData);
          setDraftExists(true);
          console.log(`✅ Restored data for ${key}, age: ${Math.round(age/60000)} minutes`);
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
  }, [key, mobileOptimized]);

  const clearSavedData = useCallback(() => {
    localStorage.removeItem(`autosave_${key}`);
    localStorage.removeItem(`autosave_${key}_timestamp`);
    localStorage.removeItem(`autosave_${key}_visibility`);
    
    if (mobileOptimized) {
      sessionStorage.removeItem(`mobile_backup_${key}`);
    }
    
    hasUnsavedChanges.current = false;
    setDraftExists(false);
    
    console.log(`🗑️ Cleared all autosave data for ${key}`);
    
    toast({
      title: "Черновик очищен",
      description: "Все сохраненные данные удалены",
    });
  }, [key, mobileOptimized, toast]);

  const checkDraftExists = useCallback(() => {
    const hasLocalStorage = !!localStorage.getItem(`autosave_${key}`);
    const hasSessionStorage = mobileOptimized && !!sessionStorage.getItem(`mobile_backup_${key}`);
    const timestamp = localStorage.getItem(`autosave_${key}_timestamp`);
    
    let exists = false;
    if ((hasLocalStorage || hasSessionStorage) && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      exists = age < 24 * 60 * 60 * 1000;
    }
    
    setDraftExists(exists);
    return exists;
  }, [key, mobileOptimized]);

  useEffect(() => {
    checkDraftExists();
  }, [checkDraftExists]);

  return {
    loadSavedData,
    clearSavedData,
    hasUnsavedChanges: hasUnsavedChanges.current,
    draftExists,
    checkDraftExists,
    saveNow,
    isVisible: isVisible.current
  };
};