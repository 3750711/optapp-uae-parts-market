declare global {
  interface Window {
    clarity?: {
      (action: string, ...args: any[]): void;
      q?: any[];
    };
  }
}

interface ClarityConfig {
  projectId: string;
  enabled: boolean;
  maskSensitiveData: boolean;
}

class ClarityTracker {
  private config: ClarityConfig;
  private isInitialized = false;

  constructor(config: ClarityConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Only initialize in production and if enabled
    if (!this.config.enabled || this.isInitialized) {
      return;
    }

    try {
      // Create Clarity script element
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = `https://www.clarity.ms/tag/${this.config.projectId}`;

      // Initialize Clarity function before script loads
      window.clarity = window.clarity || function(...args: any[]) {
        (window.clarity!.q = window.clarity!.q || []).push(args);
      };

      // Add script to head
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode?.insertBefore(script, firstScript);

      // Wait for script to load
      await new Promise<void>((resolve, reject) => {
        script.onload = () => {
          this.isInitialized = true;
          console.log('✅ Microsoft Clarity initialized successfully');
          resolve();
        };
        script.onerror = () => {
          console.warn('⚠️ Failed to load Microsoft Clarity script');
          reject(new Error('Clarity script failed to load'));
        };
      });

      // Configure Clarity settings
      this.configureClaritySettings();

    } catch (error) {
      console.warn('⚠️ Clarity initialization failed:', error);
    }
  }

  private configureClaritySettings(): void {
    if (!window.clarity || !this.isInitialized) return;

    try {
      // Build mask selector array
      const maskSelectors = ['iframe', '[data-telegram-login]', '.telegram-login', '[data-clarity-ignore]'];
      
      // Add sensitive data selectors if configured
      if (this.config.maskSensitiveData) {
        window.clarity('set', 'maskTextSelector', '.price, .contact-info, .phone, .email');
        maskSelectors.push('[data-clarity-mask]');
      }

      // Apply combined mask selector (this fully masks/hides elements)
      window.clarity('set', 'maskSelector', maskSelectors.join(', '));
      
      // Ignore specific Telegram iframe sources completely
      window.clarity('set', 'ignoreSelector', 'iframe[src*="oauth.telegram.org"], iframe[src*="telegram.org"], [data-clarity-ignore]');
      
      // Disable iframe tracking completely
      window.clarity('set', 'trackIFrames', false);

      // Set custom dimensions for better tracking
      window.clarity('set', 'environment', import.meta.env.MODE);
      window.clarity('set', 'version', '1.0.0');
      
    } catch (error) {
      console.warn('⚠️ Clarity configuration failed:', error);
    }
  }

  // Track custom events
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.isInitialized || !window.clarity) {
      return;
    }

    try {
      window.clarity('event', eventName, properties);
    } catch (error) {
      console.warn('⚠️ Clarity event tracking failed:', error);
    }
  }

  // Track page views
  trackPageView(pageName: string, properties?: Record<string, any>): void {
    this.trackEvent('page_view', { page: pageName, ...properties });
  }

  // Track user interactions
  trackInteraction(action: string, element: string, properties?: Record<string, any>): void {
    this.trackEvent('user_interaction', { action, element, ...properties });
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, category?: string): void {
    this.trackEvent('performance_metric', { metric, value, category });
  }

  // Track errors
  trackError(error: string, context?: string): void {
    this.trackEvent('error', { error, context });
  }

  // Check if Clarity is ready
  isReady(): boolean {
    return this.isInitialized && !!window.clarity;
  }
}

// Create and configure Clarity tracker
const clarityConfig: ClarityConfig = {
  projectId: 'snkkta1p61',
  enabled: import.meta.env.PROD, // Only enable in production
  maskSensitiveData: true, // Mask sensitive data like prices and contacts
};

export const clarityTracker = new ClarityTracker(clarityConfig);

// Initialize Clarity when DOM is ready
export const initializeClarity = async (): Promise<void> => {
  if (typeof window === 'undefined') {
    return; // Skip during SSR
  }

  try {
    await clarityTracker.initialize();
  } catch (error) {
    console.warn('⚠️ Clarity initialization failed:', error);
  }
};

// Export tracking functions for use in components
export const trackClarityEvent = (eventName: string, properties?: Record<string, any>) => {
  clarityTracker.trackEvent(eventName, properties);
};

export const trackClarityPageView = (pageName: string, properties?: Record<string, any>) => {
  clarityTracker.trackPageView(pageName, properties);
};

export const trackClarityInteraction = (action: string, element: string, properties?: Record<string, any>) => {
  clarityTracker.trackInteraction(action, element, properties);
};

export const trackClarityPerformance = (metric: string, value: number, category?: string) => {
  clarityTracker.trackPerformance(metric, value, category);
};

export const trackClarityError = (error: string, context?: string) => {
  clarityTracker.trackError(error, context);
};