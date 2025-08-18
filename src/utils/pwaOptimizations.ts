// PWA-specific optimizations to prevent constant refreshes

interface PWAOptimizationConfig {
  enableBfcacheOptimization: boolean;
  enableMemoryOptimization: boolean;
  enableLifecycleOptimization: boolean;
  debugMode: boolean;
}

class PWAOptimizer {
  private config: PWAOptimizationConfig;
  private memoryPressureThreshold = 50; // MB
  private isPWA = false;

  constructor(config: Partial<PWAOptimizationConfig> = {}) {
    this.config = {
      enableBfcacheOptimization: true,
      enableMemoryOptimization: true,
      enableLifecycleOptimization: true,
      debugMode: import.meta.env.DEV,
      ...config
    };
    
    this.detectPWA();
    this.init();
  }

  private detectPWA() {
    if (typeof window === 'undefined') return;
    
    this.isPWA = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      // @ts-ignore
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');
  }

  private init() {
    if (!this.isPWA) return;

    if (this.config.enableBfcacheOptimization) {
      this.optimizeBfcache();
    }

    if (this.config.enableMemoryOptimization) {
      this.optimizeMemoryUsage();
    }

    if (this.config.enableLifecycleOptimization) {
      this.optimizeLifecycleEvents();
    }

    if (this.config.debugMode) {
      this.enablePWADebugMode();
    }
  }

  private optimizeBfcache() {
    // Remove problematic beforeunload listeners for PWA
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = function(type, listener, options) {
      if (type === 'beforeunload' && pwaOptimizer.isPWA) {
        console.log('🏠 PWA: Blocking beforeunload listener for bfcache optimization');
        return;
      }
      return originalAddEventListener.call(this, type, listener, options);
    };

    // Optimize unload behavior
    window.addEventListener('pagehide', (event) => {
      // For PWA, prefer bfcache over unload events
      if (event.persisted) {
        console.log('🏠 PWA: Page successfully cached');
      }
    }, { passive: true });

    // Detect bfcache restoration
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        console.log('🏠 PWA: Page restored from bfcache');
        // Refresh any stale data if needed
        this.handleBfcacheRestore();
      }
    }, { passive: true });
  }

  private optimizeMemoryUsage() {
    // Monitor memory usage
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      
      const checkMemoryPressure = () => {
        const usedMB = memoryInfo.usedJSHeapSize / 1048576;
        
        if (usedMB > this.memoryPressureThreshold) {
          console.log(`🏠 PWA: Memory pressure detected (${usedMB.toFixed(1)}MB)`);
          this.handleMemoryPressure();
        }
      };

      // Check memory every 30 seconds in PWA mode
      setInterval(checkMemoryPressure, 30000);
    }

    // Optimize images for memory efficiency
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseNonCriticalTasks();
      } else {
        this.resumeNonCriticalTasks();
      }
    }, { passive: true });
  }

  private optimizeLifecycleEvents() {
    // Centralize all lifecycle management
    let lifecycleCallbacks: Array<() => void> = [];

    // Replace scattered event listeners with centralized management
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Use requestIdleCallback for non-critical saves
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            lifecycleCallbacks.forEach(cb => cb());
          });
        }
      }
    }, { passive: true });
  }

  private handleBfcacheRestore() {
    // Dispatch custom event for components to handle bfcache restore
    const event = new CustomEvent('pwa:bfcache-restore', {
      detail: { timestamp: Date.now() }
    });
    document.dispatchEvent(event);
  }

  private handleMemoryPressure() {
    // Clear non-essential caches
    if ('caches' in window) {
      // Only clear non-critical caches, keep essential ones
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('images') || name.includes('temp')) {
            caches.delete(name);
          }
        });
      });
    }

    // Trigger garbage collection hint
    if ('gc' in window) {
      (window as any).gc();
    }

    // Dispatch memory pressure event
    const event = new CustomEvent('pwa:memory-pressure');
    document.dispatchEvent(event);
  }

  private pauseNonCriticalTasks() {
    // Pause animations, image loading, etc.
    document.querySelectorAll('video, audio').forEach((media: any) => {
      if (!media.paused) {
        media.pause();
        media.dataset.pausedByPWA = 'true';
      }
    });
  }

  private resumeNonCriticalTasks() {
    // Resume paused tasks
    document.querySelectorAll('[data-paused-by-pwa="true"]').forEach((media: any) => {
      media.play().catch(() => {});
      delete media.dataset.pausedByPWA;
    });
  }

  private enablePWADebugMode() {
    // Add PWA debug info to console
    console.log('🏠 PWA Debug Mode Enabled', {
      isPWA: this.isPWA,
      config: this.config,
      userAgent: navigator.userAgent,
      displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
    });

    // Add debug panel to DOM
    this.createDebugPanel();
  }

  private createDebugPanel() {
    if (!import.meta.env.DEV) return;

    const debugPanel = document.createElement('div');
    debugPanel.id = 'pwa-debug-panel';
    debugPanel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 8px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 10px;
      z-index: 10000;
      max-width: 200px;
      display: ${this.isPWA ? 'block' : 'none'};
    `;
    
    const updateDebugInfo = () => {
      const memInfo = 'memory' in performance ? (performance as any).memory : null;
      debugPanel.innerHTML = `
        <strong>PWA Debug</strong><br>
        Mode: ${this.isPWA ? 'PWA' : 'Browser'}<br>
        Visibility: ${document.visibilityState}<br>
        ${memInfo ? `Memory: ${(memInfo.usedJSHeapSize / 1048576).toFixed(1)}MB` : ''}
      `;
    };

    updateDebugInfo();
    setInterval(updateDebugInfo, 1000);
    document.body.appendChild(debugPanel);
  }

  // Public API
  public isPWAMode(): boolean {
    return this.isPWA;
  }

  public getOptimizationStatus() {
    return {
      isPWA: this.isPWA,
      config: this.config,
      memoryUsage: 'memory' in performance ? 
        (performance as any).memory.usedJSHeapSize / 1048576 : null
    };
  }
}

// Global instance
export const pwaOptimizer = new PWAOptimizer();

// Helper functions for components
export const isPWAMode = () => pwaOptimizer.isPWAMode();

export const optimizeForPWA = <T extends (...args: any[]) => any>(
  callback: T,
  options: { delay?: number; skipInPWA?: boolean } = {}
): T => {
  const { delay = 0, skipInPWA = false } = options;

  return ((...args: any[]) => {
    if (skipInPWA && isPWAMode()) {
      console.log('🏠 PWA: Skipping operation for PWA optimization');
      return;
    }

    if (delay > 0 && isPWAMode()) {
      // Use requestIdleCallback in PWA mode for better performance
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => callback(...args));
      } else {
        setTimeout(() => callback(...args), delay);
      }
    } else {
      return callback(...args);
    }
  }) as T;
};
