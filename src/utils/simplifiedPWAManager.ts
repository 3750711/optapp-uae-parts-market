// Simplified PWA Manager - replacing complex PWA architecture with stable, minimal approach
export interface SimplePWAOptions {
  onVisibilityChange?: (isHidden: boolean) => void;
  onPageHide?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

class SimplifiedPWAManager {
  private isInitialized = false;
  private isPWAMode = false;
  private listeners: Map<string, SimplePWAOptions> = new Map();

  constructor() {
    this.detectPWA();
    this.initialize();
  }

  private detectPWA(): void {
    // Simple PWA detection - conservative approach
    this.isPWAMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://') ||
      /iPhone|iPad|iPod/.test(navigator.userAgent) && window.navigator.standalone;
  }

  private initialize(): void {
    if (this.isInitialized) return;
    
    // Minimal event listeners - only essential ones
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.addEventListener('focus', this.handleFocus.bind(this));
    window.addEventListener('blur', this.handleBlur.bind(this));
    window.addEventListener('pagehide', this.handlePageHide.bind(this));
    
    this.isInitialized = true;
  }

  private handleVisibilityChange(): void {
    const isHidden = document.hidden;
    this.listeners.forEach(options => {
      options.onVisibilityChange?.(isHidden);
    });
  }

  private handleFocus(): void {
    this.listeners.forEach(options => {
      options.onFocus?.();
    });
  }

  private handleBlur(): void {
    this.listeners.forEach(options => {
      options.onBlur?.();
    });
  }

  private handlePageHide(): void {
    this.listeners.forEach(options => {
      options.onPageHide?.();
    });
  }

  public register(id: string, options: SimplePWAOptions): () => void {
    this.listeners.set(id, options);
    
    return () => {
      this.listeners.delete(id);
    };
  }

  public shouldOptimizeForPWA(): boolean {
    return this.isPWAMode;
  }

  public forceSave(reason?: string): void {
    console.log(`🔄 Force save triggered: ${reason || 'manual'}`);
    this.handlePageHide();
  }

  public getPWAStatus() {
    return {
      isPWA: this.isPWAMode,
      isInitialized: this.isInitialized,
      listenersCount: this.listeners.size
    };
  }
}

// Export singleton instance
export const simplifiedPWAManager = new SimplifiedPWAManager();