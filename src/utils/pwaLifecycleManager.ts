// PWA-optimized lifecycle management to prevent constant refreshes
import { debounce } from '@/utils/debounce';

interface LifecycleOptions {
  onVisibilityChange?: (isHidden: boolean) => void;
  onPageHide?: () => void;
  onPageShow?: (event: PageTransitionEvent) => void;
  onFreeze?: () => void;
  onResume?: () => void;
  enableBfcacheOptimization?: boolean;
  debounceDelay?: number;
}

class PWALifecycleManager {
  private listeners: Map<string, LifecycleOptions> = new Map();
  private isInitialized = false;
  private isPWA = false;
  private lastVisibilityChange = 0;
  private isPageFrozen = false;
  
  constructor() {
    this.detectPWA();
    this.initializeOnce();
  }

  private detectPWA() {
    if (typeof window === 'undefined') return;
    
    // Detect PWA mode
    this.isPWA = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      // @ts-ignore - iOS Safari PWA detection
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
      
    console.log('🏠 PWA Detection:', { isPWA: this.isPWA });
  }

  private initializeOnce() {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    this.isInitialized = true;
    
    // Debounced visibility handler to prevent rapid firing
    const debouncedVisibilityHandler = debounce((isHidden: boolean) => {
      // Skip fake visibility changes (rapid toggles within 100ms)
      const now = Date.now();
      if (now - this.lastVisibilityChange < 100) {
        console.log('🔄 Skipping rapid visibility change');
        return;
      }
      this.lastVisibilityChange = now;
      
      this.listeners.forEach((options) => {
        options.onVisibilityChange?.(isHidden);
      });
    }, this.isPWA ? 300 : 150);

    // Centralized visibility change handler
    document.addEventListener('visibilitychange', () => {
      const isHidden = document.visibilityState === 'hidden';
      debouncedVisibilityHandler(isHidden);
    }, { passive: true });

    // PWA-optimized page hide handler
    window.addEventListener('pagehide', (event) => {
      // For PWA, only save if it's not a bfcache restore
      if (this.isPWA && event.persisted) {
        console.log('🏠 PWA: Page cached for fast restore');
        return;
      }
      
      this.listeners.forEach((options) => {
        options.onPageHide?.();
      });
    }, { passive: true });

    // Bfcache restoration handler
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        console.log('🏠 PWA: Page restored from bfcache');
        this.listeners.forEach((options) => {
          options.onPageShow?.(event);
        });
      }
    }, { passive: true });

    // Page freeze/resume detection (modern browsers)
    if ('onfreeze' in document) {
      document.addEventListener('freeze', () => {
        console.log('🏠 PWA: Page frozen');
        this.isPageFrozen = true;
        this.listeners.forEach((options) => {
          options.onFreeze?.();
        });
      }, { passive: true });

      document.addEventListener('resume', () => {
        console.log('🏠 PWA: Page resumed');
        this.isPageFrozen = false;
        this.listeners.forEach((options) => {
          options.onResume?.();
        });
      }, { passive: true });
    }

    // Bfcache monitoring
    this.monitorBfcache();
  }

  private monitorBfcache() {
    if (typeof window === 'undefined' || !('PerformanceNavigationTiming' in window)) return;

    // Check if page was restored from bfcache
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation?.type === 'back_forward') {
      console.log('🏠 PWA: Restored from bfcache successfully');
    }

    // Monitor bfcache blocking reasons
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const nav = entry as PerformanceNavigationTiming;
              if (nav.type === 'reload' && this.isPWA) {
                console.warn('⚠️ PWA: Unexpected reload detected - bfcache may be blocked');
              }
            }
          }
        });
        observer.observe({ entryTypes: ['navigation'] });
      } catch (error) {
        console.log('🏠 PWA: PerformanceObserver not fully supported');
      }
    }
  }

  register(id: string, options: LifecycleOptions) {
    this.listeners.set(id, options);
    console.log(`🏠 PWA: Registered lifecycle listener "${id}"`);
    
    return () => {
      this.listeners.delete(id);
      console.log(`🏠 PWA: Unregistered lifecycle listener "${id}"`);
    };
  }

  // Force save for critical operations
  forceSave(reason: string = 'manual') {
    console.log(`🏠 PWA: Force save triggered - ${reason}`);
    this.listeners.forEach((options) => {
      options.onPageHide?.();
    });
  }

  // Check if optimizations should be applied
  shouldOptimizeForPWA(): boolean {
    return this.isPWA;
  }

  isCurrentlyFrozen(): boolean {
    return this.isPageFrozen;
  }

  // Get PWA status for conditional behavior
  getPWAStatus() {
    return {
      isPWA: this.isPWA,
      isFrozen: this.isPageFrozen,
      listenerCount: this.listeners.size
    };
  }
}

// Singleton instance
export const pwaLifecycleManager = new PWALifecycleManager();

// Hook for React components
export const usePWALifecycle = (id: string, options: LifecycleOptions) => {
  const { useEffect } = require('react');
  
  useEffect(() => {
    return pwaLifecycleManager.register(id, options);
  }, [id]);

  return {
    isPWA: pwaLifecycleManager.shouldOptimizeForPWA(),
    forceSave: pwaLifecycleManager.forceSave,
    status: pwaLifecycleManager.getPWAStatus()
  };
};