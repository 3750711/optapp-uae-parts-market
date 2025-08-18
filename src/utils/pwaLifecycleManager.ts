// PWA-optimized lifecycle management to prevent constant refreshes
import { debounce } from '@/utils/debounce';
import { useEffect } from 'react';

interface LifecycleOptions {
  onVisibilityChange?: (isHidden: boolean) => void;
  onPageHide?: () => void;
  onPageShow?: (event: PageTransitionEvent) => void;
  onFreeze?: () => void;
  onResume?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  enableBfcacheOptimization?: boolean;
  debounceDelay?: number;
  skipFastSwitching?: boolean;
}

class PWALifecycleManager {
  private listeners: Map<string, LifecycleOptions> = new Map();
  private isInitialized = false;
  private isPWA = false;
  private lastVisibilityChange = 0;
  private lastFocusChange = 0;
  private isPageFrozen = false;
  private isFastSwitching = false;
  private rapidChangeCount = 0;
  private bfcacheBlocked = false;
  
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
    
    // Optimized visibility handler with PWA-specific logic
    const debouncedVisibilityHandler = debounce((isHidden: boolean) => {
      const now = Date.now();
      
      // Detect rapid switching (PWA background/foreground cycles)
      if (now - this.lastVisibilityChange < 150) {
        this.rapidChangeCount++;
        if (this.rapidChangeCount > 3) {
          this.isFastSwitching = true;
          console.log('🏠 PWA: Fast app switching detected - throttling events');
          setTimeout(() => {
            this.isFastSwitching = false;
            this.rapidChangeCount = 0;
          }, 2000);
          return;
        }
      } else {
        this.rapidChangeCount = 0;
        this.isFastSwitching = false;
      }
      
      this.lastVisibilityChange = now;
      
      // Only trigger if not in fast switching mode
      if (!this.isFastSwitching) {
        this.listeners.forEach((options) => {
          if (!options.skipFastSwitching || !this.isFastSwitching) {
            options.onVisibilityChange?.(isHidden);
          }
        });
      }
    }, this.isPWA ? 400 : 200);

    // Centralized visibility change handler
    document.addEventListener('visibilitychange', () => {
      const isHidden = document.visibilityState === 'hidden';
      debouncedVisibilityHandler(isHidden);
    }, { passive: true });

    // Focus/blur handlers for additional PWA lifecycle detection
    let focusDebounceTimer: NodeJS.Timeout;
    window.addEventListener('focus', () => {
      clearTimeout(focusDebounceTimer);
      focusDebounceTimer = setTimeout(() => {
        if (!this.isFastSwitching) {
          const now = Date.now();
          this.lastFocusChange = now;
          this.listeners.forEach((options) => {
            options.onFocus?.();
          });
        }
      }, this.isPWA ? 200 : 100);
    }, { passive: true });

    window.addEventListener('blur', () => {
      clearTimeout(focusDebounceTimer);
      focusDebounceTimer = setTimeout(() => {
        if (!this.isFastSwitching) {
          this.listeners.forEach((options) => {
            options.onBlur?.();
          });
        }
      }, this.isPWA ? 200 : 100);
    }, { passive: true });

    // PWA-optimized page hide handler
    window.addEventListener('pagehide', (event) => {
      // For PWA with bfcache, minimize operations to avoid blocking
      if (this.isPWA && event.persisted) {
        console.log('🏠 PWA: Page cached for bfcache - minimal operations');
        // Only execute critical save operations
        this.listeners.forEach((options) => {
          if (options.enableBfcacheOptimization) {
            options.onPageHide?.();
          }
        });
        return;
      }
      
      // Regular page hide for non-bfcache scenarios
      if (!this.isFastSwitching) {
        this.listeners.forEach((options) => {
          options.onPageHide?.();
        });
      }
    }, { passive: true });

    // Bfcache restoration handler
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        console.log('🏠 PWA: Page restored from bfcache - rehydrating state');
        // Reset rapid change detection on bfcache restore
        this.rapidChangeCount = 0;
        this.isFastSwitching = false;
        
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
      listenerCount: this.listeners.size,
      isFastSwitching: this.isFastSwitching,
      rapidChangeCount: this.rapidChangeCount,
      bfcacheBlocked: this.bfcacheBlocked
    };
  }

  // Check if currently in fast switching mode
  isFastSwitchingMode(): boolean {
    return this.isFastSwitching;
  }

  // Get time since last visibility change
  getTimeSinceLastChange(): number {
    return Date.now() - this.lastVisibilityChange;
  }
}

// Singleton instance
export const pwaLifecycleManager = new PWALifecycleManager();

// Hook for React components
export const usePWALifecycle = (id: string, options: LifecycleOptions) => {
  
  useEffect(() => {
    return pwaLifecycleManager.register(id, options);
  }, [id]);

  return {
    isPWA: pwaLifecycleManager.shouldOptimizeForPWA(),
    forceSave: pwaLifecycleManager.forceSave,
    status: pwaLifecycleManager.getPWAStatus()
  };
};