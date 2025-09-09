// PWA-optimized lifecycle management to prevent constant refreshes
import { debounce } from '@/utils/debounce';
import { LifecycleOptions } from '@/types/pwa';

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
    this.isPWA = this.detectPWA();
    this.initializeOnce();
  }

  private detectPWA(): boolean {
    // Enhanced PWA detection with iOS and mobile optimization
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        ('standalone' in window.navigator && window.navigator.standalone === true);
    
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                       (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    const isTelegramWebView = /TelegramWebView/.test(navigator.userAgent);
    
    const hasPWAFeatures = ('serviceWorker' in navigator) ||
                          (document.querySelector('link[rel="manifest"]') !== null);
    
    // Consider iOS devices and Telegram WebView as PWA-like for optimization
    return isStandalone || (isIOSDevice && hasPWAFeatures) || isTelegramWebView;
  }

  private initializeOnce() {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    this.isInitialized = true;
    
    // Detect device capabilities for better mobile handling
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                       (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isTelegramWebView = /TelegramWebView/.test(navigator.userAgent);
    
    // Use shorter debounce for mobile devices to be more responsive
    const effectiveDebounce = (isIOSDevice || isTelegramWebView) ? 150 : (this.isPWA ? 400 : 200);
    
    // Optimized visibility handler with PWA-specific logic
    const debouncedVisibilityHandler = debounce((isHidden: boolean) => {
      const now = Date.now();
      
      // Detect rapid switching (PWA background/foreground cycles)
      if (now - this.lastVisibilityChange < 150) {
        this.rapidChangeCount++;
        if (this.rapidChangeCount > 3) {
          this.isFastSwitching = true;
          
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
    }, effectiveDebounce);

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
      }, effectiveDebounce);
    }, { passive: true });

    window.addEventListener('blur', () => {
      clearTimeout(focusDebounceTimer);
      focusDebounceTimer = setTimeout(() => {
        if (!this.isFastSwitching) {
          this.listeners.forEach((options) => {
            options.onBlur?.();
          });
        }
      }, effectiveDebounce);
    }, { passive: true });

    // PWA-optimized page hide handler - critical for iOS bfcache
    window.addEventListener('pagehide', (event) => {
      // For PWA with bfcache, minimize operations to avoid blocking
      if (this.isPWA && event.persisted) {
        
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
    }, { passive: false }); // Not passive for critical saves

    // Bfcache restoration handler
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        
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
        
        this.isPageFrozen = true;
        this.listeners.forEach((options) => {
          options.onFreeze?.();
        });
      }, { passive: false }); // Not passive for critical saves

      document.addEventListener('resume', () => {
        
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
        
      }
    }
  }

  register(id: string, options: LifecycleOptions) {
    this.listeners.set(id, options);
    
    
    return () => {
      this.listeners.delete(id);
      
    };
  }

  // Force save for critical operations
  forceSave(reason: string = 'manual') {
    
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