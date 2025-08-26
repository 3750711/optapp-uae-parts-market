import { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from '@/utils/debounce';
import { pwaLifecycleManager } from '@/utils/pwaLifecycleManager';

interface PWAAutosaveOptions {
  key: string;
  data: any;
  delay?: number;
  enabled?: boolean;
  excludeFields?: string[];
  onSave?: () => void;
  onRestore?: (data: any) => void;
}

export const usePWAOptimizedAutosave = ({
  key,
  data,
  delay = 2000,
  enabled = true,
  excludeFields = [],
  onSave,
  onRestore
}: PWAAutosaveOptions) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const lastSavedData = useRef<string>('');
  const isFirstRender = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // PWA-aware debounced save with longer delay for PWA mode
  const isPWA = pwaLifecycleManager.shouldOptimizeForPWA();
  const effectiveDelay = isPWA ? Math.max(delay * 1.5, 3000) : delay;

  // Filter out excluded fields from data
  const filterData = useCallback((rawData: any) => {
    if (!rawData || typeof rawData !== 'object') return rawData;
    
    const filtered = { ...rawData };
    excludeFields.forEach(field => {
      delete filtered[field];
    });
    return filtered;
  }, [excludeFields]);

  // Enhanced save function with PWA optimizations
  const saveToStorage = useCallback((dataToSave: any) => {
    if (!enabled) return;

    try {
      const filteredData = filterData(dataToSave);
      const serializedData = JSON.stringify(filteredData);
      
      // Skip if data hasn't actually changed
      if (serializedData === lastSavedData.current) {
        return;
      }

      // Use different strategies for PWA vs browser
      if (isPWA && 'requestIdleCallback' in window) {
        // In PWA, use requestIdleCallback for better performance
        requestIdleCallback(() => {
          localStorage.setItem(`autosave_${key}`, serializedData);
          localStorage.setItem(`autosave_${key}_timestamp`, Date.now().toString());
          lastSavedData.current = serializedData;
          setHasUnsavedChanges(false);
          onSave?.();
          console.log(`🏠 PWA Autosave: ${key}`);
        });
      } else {
        // Regular browser save
        localStorage.setItem(`autosave_${key}`, serializedData);
        localStorage.setItem(`autosave_${key}_timestamp`, Date.now().toString());
        lastSavedData.current = serializedData;
        setHasUnsavedChanges(false);
        onSave?.();
        console.log(`💾 Autosave: ${key}`);
      }
    } catch (error) {
      console.error('💾 Autosave error:', error);
    }
  }, [key, enabled, filterData, isPWA, onSave]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(saveToStorage, effectiveDelay),
    [saveToStorage, effectiveDelay]
  );

  // Immediate save for lifecycle events
  const saveNow = useCallback((overrideData?: any) => {
    if (!enabled) return;
    
    clearTimeout(saveTimeoutRef.current);
    debouncedSave.cancel();
    
    const dataToSave = overrideData || data;
    saveToStorage(dataToSave);
  }, [enabled, data, saveToStorage, debouncedSave]);

  // Auto-save when data changes
  useEffect(() => {
    if (!enabled || isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const currentData = JSON.stringify(filterData(data));
    if (currentData !== lastSavedData.current) {
      setHasUnsavedChanges(true);
      
      // For PWA, be more conservative with autosave frequency
      if (isPWA) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          debouncedSave(data);
        }, effectiveDelay);
      } else {
        debouncedSave(data);
      }
    }
  }, [data, enabled, filterData, debouncedSave, effectiveDelay, isPWA]);

  // Register with PWA lifecycle manager for visibility changes with mobile optimization
  useEffect(() => {
    if (!enabled) return;
    
    const unregister = pwaLifecycleManager.register(`autosave-${key}`, {
      onVisibilityChange: (isHidden: boolean) => {
        if (isHidden && hasUnsavedChanges) {
          console.log(`📱 PWA visibility changed to hidden, saving ${key} immediately`);
          saveNow();
        }
      },
      onPageHide: () => {
        if (hasUnsavedChanges) {
          console.log(`📱 PWA page hiding, saving ${key} immediately`);
          saveNow();
        }
      },
      onFreeze: () => {
        if (hasUnsavedChanges) {
          console.log(`❄️ PWA frozen, saving ${key} immediately`);
          saveNow();
        }
      },
      onBlur: () => {
        // Additional save on blur for mobile browsers
        if (hasUnsavedChanges && (navigator.userAgent.includes('Mobile') || navigator.userAgent.includes('iPhone'))) {
          console.log(`📱 Mobile blur detected, saving ${key} immediately`);
          saveNow();
        }
      },
      // Optimize for mobile with shorter debounce and less aggressive fast-switching detection
      debounceDelay: navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad') ? 100 : 300,
      skipFastSwitching: true,
      enableBfcacheOptimization: true
    });

    return unregister;
  }, [key, enabled, saveNow, hasUnsavedChanges]);

  // Load saved data
  const loadSavedData = useCallback(() => {
    try {
      const savedData = localStorage.getItem(`autosave_${key}`);
      const timestamp = localStorage.getItem(`autosave_${key}_timestamp`);
      
      if (savedData && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        // Keep data for longer in PWA mode (48h vs 24h)
        const maxAge = isPWA ? 48 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        
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
  }, [key, isPWA, onRestore]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(`autosave_${key}`);
      localStorage.removeItem(`autosave_${key}_timestamp`);
      lastSavedData.current = '';
      setHasUnsavedChanges(false);
      clearTimeout(saveTimeoutRef.current);
      debouncedSave.cancel();
    } catch (error) {
      console.error('💾 Clear autosave error:', error);
    }
  }, [key, debouncedSave]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearTimeout(saveTimeoutRef.current);
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  return {
    loadSavedData,
    clearSavedData,
    saveNow,
    hasUnsavedChanges,
    isPWAMode: isPWA
  };
};
