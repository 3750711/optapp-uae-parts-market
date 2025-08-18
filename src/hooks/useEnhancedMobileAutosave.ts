import { useEffect, useCallback, useRef, useState } from 'react';
import { debounce } from '@/utils/debounce';
import { useToast } from '@/hooks/use-toast';

// IndexedDB helper for critical data backup
const INDEXEDDB_NAME = 'LovableAutosave';
const INDEXEDDB_VERSION = 1;
const STORE_NAME = 'autosave_data';

class IndexedDBBackup {
  private db: IDBDatabase | null = null;
  
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(INDEXEDDB_NAME, INDEXEDDB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
    });
  }
  
  async save(key: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put({
        key,
        data,
        timestamp: Date.now(),
        checksum: this.generateChecksum(data)
      });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  async load(key: string): Promise<any> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result && this.verifyChecksum(result.data, result.checksum)) {
          resolve(result);
        } else {
          resolve(null);
        }
      };
    });
  }
  
  async clear(key: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  private generateChecksum(data: any): string {
    return btoa(JSON.stringify(data)).slice(0, 16);
  }
  
  private verifyChecksum(data: any, checksum: string): boolean {
    return this.generateChecksum(data) === checksum;
  }
}

const idbBackup = new IndexedDBBackup();

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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const isVisible = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const periodicSaveRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useRef(typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

  const filterDataForSave = useCallback((dataToFilter: any) => {
    if (!dataToFilter || typeof dataToFilter !== 'object') return dataToFilter;
    
    const filtered = { ...dataToFilter };
    excludeFields.forEach(field => {
      delete filtered[field];
    });
    
    return filtered;
  }, [excludeFields]);

  // Enhanced save function with multiple backup strategies
  const performSave = useCallback(async (dataToSave: any, immediate = false) => {
    try {
      setSaveStatus('saving');
      const filteredData = filterDataForSave(dataToSave);
      const serializedData = JSON.stringify(filteredData);
      
      if (serializedData !== lastSavedData.current) {
        const timestamp = Date.now().toString();
        const savePromises: Promise<void>[] = [];
        
        // Primary storage: localStorage
        savePromises.push(
          Promise.resolve().then(() => {
            localStorage.setItem(`autosave_${key}`, serializedData);
            localStorage.setItem(`autosave_${key}_timestamp`, timestamp);
            localStorage.setItem(`autosave_${key}_visibility`, isVisible.current ? 'visible' : 'hidden');
            localStorage.setItem(`autosave_${key}_checksum`, btoa(serializedData).slice(0, 16));
          })
        );
        
        // Mobile backup: sessionStorage
        if (mobileOptimized) {
          savePromises.push(
            Promise.resolve().then(() => {
              sessionStorage.setItem(`mobile_backup_${key}`, serializedData);
              sessionStorage.setItem(`mobile_backup_${key}_timestamp`, timestamp);
            }).catch(e => console.warn('SessionStorage backup failed:', e))
          );
          
          // Critical backup: IndexedDB for mobile
          if (isMobile.current) {
            savePromises.push(
              idbBackup.save(`critical_${key}`, filteredData).catch(e => console.warn('IndexedDB backup failed:', e))
            );
          }
        }
        
        // Multiple localStorage keys for redundancy
        for (let i = 1; i <= 3; i++) {
          savePromises.push(
            Promise.resolve().then(() => {
              localStorage.setItem(`autosave_${key}_backup_${i}`, serializedData);
              localStorage.setItem(`autosave_${key}_backup_${i}_timestamp`, timestamp);
            }).catch(e => console.warn(`Backup ${i} failed:`, e))
          );
        }
        
        await Promise.allSettled(savePromises);
        
        hasUnsavedChanges.current = false;
        lastSavedData.current = serializedData;
        setSaveStatus('saved');
        
        console.log(`💾 ${immediate ? 'Immediate' : 'Delayed'} save completed with multiple backups for: ${key}`);
        
        if (mobileOptimized && immediate) {
          toast({
            title: "💾 Данные сохранены",
            description: "Состояние формы автоматически сохранено",
          });
        }
        
        // Auto-hide save status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Error saving form data:', error);
      setSaveStatus('error');
      
      toast({
        title: "⚠️ Ошибка сохранения",
        description: "Не удалось сохранить черновик. Не закрывайте приложение.",
        variant: "destructive",
      });
      
      setTimeout(() => setSaveStatus('idle'), 3000);
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

  // Periodic saving for mobile devices (every 30 seconds)
  useEffect(() => {
    if (!enabled || !mobileOptimized || !isMobile.current) return;
    
    periodicSaveRef.current = setInterval(() => {
      if (hasUnsavedChanges.current) {
        console.log('⏰ Periodic mobile save triggered');
        saveNow();
      }
    }, 30000); // 30 seconds
    
    return () => {
      if (periodicSaveRef.current) {
        clearInterval(periodicSaveRef.current);
      }
    };
  }, [enabled, mobileOptimized, saveNow]);

  // Enhanced mobile event handling with freeze event
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

    // Enhanced mobile-specific events
    const handleTouchStart = () => {
      // User is interacting - ensure we save immediately on mobile
      if (hasUnsavedChanges.current) {
        console.log('👆 Touch detected - immediate save');
        saveNow();
      }
    };

    const handleOrientationChange = () => {
      console.log('📱 Orientation change - critical save');
      saveNow();
    };
    
    // Freeze event for modern mobile browsers
    const handleFreeze = () => {
      console.log('🧊 Page freeze detected - emergency save');
      saveNow();
    };
    
    // App state changes (iOS Safari specific)
    const handleAppStateChange = () => {
      console.log('📱 App state change - protective save');
      saveNow();
    };
    
    // Memory pressure events (mobile-specific)
    const handleMemoryWarning = () => {
      console.log('⚠️ Memory warning - immediate save');
      saveNow();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Modern mobile browser events
    document.addEventListener('freeze', handleFreeze);
    document.addEventListener('resume', handleAppStateChange);
    
    // iOS-specific events
    document.addEventListener('webkitvisibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handleAppStateChange);
    
    // Memory pressure (if supported)
    if ('memory' in performance) {
      window.addEventListener('memory', handleMemoryWarning);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('freeze', handleFreeze);
      document.removeEventListener('resume', handleAppStateChange);
      document.removeEventListener('webkitvisibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handleAppStateChange);
      
      if ('memory' in performance) {
        window.removeEventListener('memory', handleMemoryWarning);
      }
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      if (periodicSaveRef.current) {
        clearInterval(periodicSaveRef.current);
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

  const loadSavedData = useCallback(async () => {
    try {
      let savedData = null;
      let timestamp = null;
      let source = 'none';
      
      // Multi-source recovery strategy
      const sources = [
        () => {
          const data = localStorage.getItem(`autosave_${key}`);
          const ts = localStorage.getItem(`autosave_${key}_timestamp`);
          const checksum = localStorage.getItem(`autosave_${key}_checksum`);
          
          if (data && ts && checksum) {
            const expectedChecksum = btoa(data).slice(0, 16);
            if (checksum === expectedChecksum) {
              return { data, timestamp: ts, source: 'localStorage' };
            }
          }
          return null;
        },
        () => {
          if (!mobileOptimized) return null;
          const data = sessionStorage.getItem(`mobile_backup_${key}`);
          const ts = sessionStorage.getItem(`mobile_backup_${key}_timestamp`);
          return data && ts ? { data, timestamp: ts, source: 'sessionStorage' } : null;
        },
        async () => {
          if (!mobileOptimized || !isMobile.current) return null;
          try {
            const result = await idbBackup.load(`critical_${key}`);
            return result ? { 
              data: JSON.stringify(result.data), 
              timestamp: result.timestamp.toString(), 
              source: 'IndexedDB' 
            } : null;
          } catch (e) {
            console.warn('IndexedDB recovery failed:', e);
            return null;
          }
        },
        // Backup recovery from redundant localStorage keys
        ...Array.from({length: 3}, (_, i) => () => {
          const data = localStorage.getItem(`autosave_${key}_backup_${i + 1}`);
          const ts = localStorage.getItem(`autosave_${key}_backup_${i + 1}_timestamp`);
          return data && ts ? { data, timestamp: ts, source: `backup_${i + 1}` } : null;
        })
      ];
      
      // Try each source in order
      for (const getSource of sources) {
        try {
          const result = await getSource();
          if (result) {
            savedData = result.data;
            timestamp = result.timestamp;
            source = result.source;
            break;
          }
        } catch (e) {
          console.warn('Data source failed:', e);
        }
      }
      
      if (savedData && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < 24 * 60 * 60 * 1000) { // 24 hours
          const parsedData = JSON.parse(savedData);
          setDraftExists(true);
          console.log(`✅ Restored data for ${key} from ${source}, age: ${Math.round(age/60000)} minutes`);
          
          toast({
            title: "🔄 Данные восстановлены",
            description: `Форма восстановлена с ${source === 'localStorage' ? 'основного' : 'резервного'} хранилища`,
          });
          
          return parsedData;
        } else {
          console.log(`📅 Data too old (${Math.round(age/(60000*60))} hours), clearing`);
          clearSavedData();
        }
      }
      
      setDraftExists(false);
      return null;
    } catch (error) {
      console.error('Error loading saved form data:', error);
      setDraftExists(false);
      
      toast({
        title: "⚠️ Ошибка восстановления",
        description: "Не удалось восстановить сохраненные данные",
        variant: "destructive",
      });
      
      return null;
    }
  }, [key, mobileOptimized, toast]);

  const clearSavedData = useCallback(async () => {
    try {
      // Clear all storage sources
      localStorage.removeItem(`autosave_${key}`);
      localStorage.removeItem(`autosave_${key}_timestamp`);
      localStorage.removeItem(`autosave_${key}_visibility`);
      localStorage.removeItem(`autosave_${key}_checksum`);
      
      // Clear backup sources
      for (let i = 1; i <= 3; i++) {
        localStorage.removeItem(`autosave_${key}_backup_${i}`);
        localStorage.removeItem(`autosave_${key}_backup_${i}_timestamp`);
      }
      
      if (mobileOptimized) {
        sessionStorage.removeItem(`mobile_backup_${key}`);
        sessionStorage.removeItem(`mobile_backup_${key}_timestamp`);
        
        // Clear IndexedDB backup
        if (isMobile.current) {
          try {
            await idbBackup.clear(`critical_${key}`);
          } catch (e) {
            console.warn('IndexedDB clear failed:', e);
          }
        }
      }
      
      hasUnsavedChanges.current = false;
      setDraftExists(false);
      setSaveStatus('idle');
      
      console.log(`🗑️ Cleared all autosave data and backups for ${key}`);
      
      toast({
        title: "🗑️ Черновик очищен",
        description: "Все сохраненные данные и резервные копии удалены",
      });
    } catch (error) {
      console.error('Error clearing saved data:', error);
      toast({
        title: "⚠️ Ошибка очистки",
        description: "Не удалось полностью очистить сохраненные данные",
        variant: "destructive",
      });
    }
  }, [key, mobileOptimized, toast]);

  const checkDraftExists = useCallback(async () => {
    try {
      let exists = false;
      let latestTimestamp = 0;
      
      // Check all possible sources
      const sources = [
        localStorage.getItem(`autosave_${key}_timestamp`),
        mobileOptimized ? sessionStorage.getItem(`mobile_backup_${key}_timestamp`) : null,
        ...Array.from({length: 3}, (_, i) => localStorage.getItem(`autosave_${key}_backup_${i + 1}_timestamp`))
      ];
      
      for (const timestampStr of sources) {
        if (timestampStr) {
          const timestamp = parseInt(timestampStr);
          if (timestamp > latestTimestamp) {
            latestTimestamp = timestamp;
          }
        }
      }
      
      // Check IndexedDB if mobile
      if (mobileOptimized && isMobile.current) {
        try {
          const idbResult = await idbBackup.load(`critical_${key}`);
          if (idbResult && idbResult.timestamp > latestTimestamp) {
            latestTimestamp = idbResult.timestamp;
          }
        } catch (e) {
          console.warn('IndexedDB check failed:', e);
        }
      }
      
      if (latestTimestamp > 0) {
        const age = Date.now() - latestTimestamp;
        exists = age < 24 * 60 * 60 * 1000;
      }
      
      setDraftExists(exists);
      
      // Self-diagnosis: Log storage health
      if (mobileOptimized) {
        const diagnostics = {
          localStorage: !!localStorage.getItem(`autosave_${key}`),
          sessionStorage: !!sessionStorage.getItem(`mobile_backup_${key}`),
          backups: Array.from({length: 3}, (_, i) => !!localStorage.getItem(`autosave_${key}_backup_${i + 1}`)),
          latestAge: latestTimestamp > 0 ? Math.round((Date.now() - latestTimestamp) / 60000) : null
        };
        
        console.log(`🔍 Storage diagnostics for ${key}:`, diagnostics);
      }
      
      return exists;
    } catch (error) {
      console.error('Error checking draft existence:', error);
      setDraftExists(false);
      return false;
    }
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
    isVisible: isVisible.current,
    saveStatus,
    isMobile: isMobile.current
  };
};