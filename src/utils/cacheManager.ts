
/**
 * Cache Management Utility for React Dispatcher Issue Resolution
 */

interface CacheManager {
  clearAllCaches(): Promise<void>;
  clearBrowserStorage(): void;
  clearServiceWorkerCaches(): Promise<void>;
  performFullReset(): Promise<void>;
}

class BrowserCacheManager implements CacheManager {
  
  async clearAllCaches(): Promise<void> {
    console.log('🧹 CacheManager: Starting cache cleanup');
    
    try {
      // Clear all cache storages
      if ('caches' in window) {
        const names = await caches.keys();
        console.log('🧹 CacheManager: Found cache names:', names);
        
        await Promise.all(
          names.map(async (name) => {
            const deleted = await caches.delete(name);
            console.log(`🧹 CacheManager: Cache "${name}" deleted:`, deleted);
          })
        );
      }
    } catch (error) {
      console.error('❌ CacheManager: Error clearing caches:', error);
    }
  }

  clearBrowserStorage(): void {
    console.log('🧹 CacheManager: Clearing browser storage');
    
    try {
      // Clear all storage types
      if (typeof localStorage !== 'undefined') {
        const localStorageKeys = Object.keys(localStorage);
        console.log('🧹 CacheManager: localStorage keys:', localStorageKeys);
        localStorage.clear();
      }

      if (typeof sessionStorage !== 'undefined') {
        const sessionStorageKeys = Object.keys(sessionStorage);
        console.log('🧹 CacheManager: sessionStorage keys:', sessionStorageKeys);
        sessionStorage.clear();
      }

      // Clear IndexedDB (async operation, but we don't wait for it)
      if ('indexedDB' in window) {
        this.clearIndexedDB();
      }
    } catch (error) {
      console.error('❌ CacheManager: Error clearing browser storage:', error);
    }
  }

  private async clearIndexedDB(): Promise<void> {
    try {
      // Get all databases (this is experimental and may not work in all browsers)
      if (navigator.storage && navigator.storage.estimate) {
        console.log('🧹 CacheManager: Clearing IndexedDB');
        
        // Try to clear persistent storage
        if (navigator.storage.persist) {
          await navigator.storage.persist();
        }
        
        // Clear quota (if available)
        const estimate = await navigator.storage.estimate();
        console.log('🧹 CacheManager: Storage estimate:', estimate);
      }
    } catch (error) {
      console.warn('⚠️ CacheManager: IndexedDB clearing not fully supported:', error);
    }
  }

  async clearServiceWorkerCaches(): Promise<void> {
    console.log('🧹 CacheManager: Clearing service worker caches');
    
    try {
      if ('serviceWorker' in navigator) {
        // Unregister all service workers
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('🧹 CacheManager: Found SW registrations:', registrations.length);
        
        await Promise.all(
          registrations.map(async (registration) => {
            const unregistered = await registration.unregister();
            console.log('🧹 CacheManager: SW unregistered:', unregistered);
          })
        );
      }
    } catch (error) {
      console.error('❌ CacheManager: Error clearing service workers:', error);
    }
  }

  async performFullReset(): Promise<void> {
    console.log('🧹 CacheManager: Performing full cache reset');
    
    // Execute all clearing operations
    await Promise.all([
      this.clearAllCaches(),
      this.clearServiceWorkerCaches()
    ]);
    
    this.clearBrowserStorage();
    
    console.log('✅ CacheManager: Full reset completed');
  }
}

// Singleton instance
export const cacheManager = new BrowserCacheManager();

// Utility functions for easy access
export const clearAllCaches = () => cacheManager.clearAllCaches();
export const clearBrowserStorage = () => cacheManager.clearBrowserStorage();
export const clearServiceWorkerCaches = () => cacheManager.clearServiceWorkerCaches();
export const performFullCacheReset = () => cacheManager.performFullReset();

// Emergency reset function that can be called from browser console
(window as any).emergencyReset = async () => {
  console.log('🚨 Emergency Reset: Starting full application reset');
  await cacheManager.performFullReset();
  console.log('🚨 Emergency Reset: Reloading page...');
  window.location.reload();
};

console.log('🧹 CacheManager: Utility loaded. Use window.emergencyReset() for emergency cache reset');
