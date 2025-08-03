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
      // Comprehensive mask selectors - completely hide these from Clarity
      const maskSelectors = [
        'iframe',
        '[data-telegram-login]', 
        '.telegram-login',
        '.telegram-widget-container',
        '[data-clarity-ignore]',
        'script[src*="telegram.org"]',
        'iframe[src*="telegram.org"]',
        'iframe[src*="oauth.telegram.org"]'
      ];
      
      // Add sensitive data selectors if configured
      if (this.config.maskSensitiveData) {
        window.clarity('set', 'maskTextSelector', '.price, .contact-info, .phone, .email');
        maskSelectors.push('[data-clarity-mask]');
      }

      // Apply combined mask selector (this fully masks/hides elements)
      window.clarity('set', 'maskSelector', maskSelectors.join(', '));
      
      // Comprehensive ignore selectors - completely ignore these elements
      const ignoreSelectors = [
        'iframe[src*="oauth.telegram.org"]',
        'iframe[src*="telegram.org"]', 
        'script[src*="telegram.org"]',
        '.telegram-widget-container',
        '[data-telegram-login]',
        '.telegram-login',
        '[data-clarity-ignore]'
      ];
      window.clarity('set', 'ignoreSelector', ignoreSelectors.join(', '));
      
      // Aggressively disable iframe tracking
      window.clarity('set', 'trackIFrames', false);
      window.clarity('set', 'trackCrossOriginIFrames', false);

      // Set custom dimensions for better tracking
      window.clarity('set', 'environment', import.meta.env.MODE);
      window.clarity('set', 'version', '1.0.0');

      // Set up MutationObserver to catch dynamic Telegram elements
      this.setupTelegramElementObserver();
      
    } catch (error) {
      console.warn('⚠️ Clarity configuration failed:', error);
    }
  }

  private setupTelegramElementObserver(): void {
    try {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Check if it's a Telegram iframe or related element
              if (
                element.tagName === 'IFRAME' && 
                (element.getAttribute('src')?.includes('telegram.org') || 
                 element.getAttribute('src')?.includes('oauth.telegram.org'))
              ) {
                // Immediately add ignore attribute
                element.setAttribute('data-clarity-ignore', 'true');
                console.log('🚫 Telegram iframe detected and ignored by Clarity');
              }
              
              // Check for Telegram widget containers
              if (element.classList.contains('telegram-widget-container') ||
                  element.hasAttribute('data-telegram-login')) {
                element.setAttribute('data-clarity-ignore', 'true');
                console.log('🚫 Telegram widget container ignored by Clarity');
              }

              // Check children for Telegram elements
              const telegramIframes = element.querySelectorAll('iframe[src*="telegram.org"]');
              const telegramContainers = element.querySelectorAll('.telegram-widget-container, [data-telegram-login]');
              
              [...telegramIframes, ...telegramContainers].forEach(el => {
                el.setAttribute('data-clarity-ignore', 'true');
              });
            }
          });
        });
      });

      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      console.log('✅ Telegram element observer setup complete');
    } catch (error) {
      console.warn('⚠️ Failed to setup Telegram element observer:', error);
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