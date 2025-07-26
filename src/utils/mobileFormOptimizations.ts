import { measurePerformance } from '@/utils/productionOptimizer';

// Mobile-specific performance optimizations
export const initMobileFormOptimizations = () => {
  const perf = measurePerformance('Mobile Form Optimizations');
  
  try {
    // Preconnect to critical domains
    preconnectDomains();
    
    // Setup performance monitoring
    setupMobilePerformanceMonitoring();
    
    // Optimize touch interactions
    optimizeTouchInteractions();
    
    // Setup viewport optimizations
    setupViewportOptimizations();
    
    console.log('✅ Mobile form optimizations initialized');
  } catch (error) {
    console.error('❌ Error initializing mobile optimizations:', error);
  } finally {
    perf.end();
  }
};

// Preconnect to critical domains for faster loading
const preconnectDomains = () => {
  const domains = [
    'https://res.cloudinary.com',
    'https://api.cloudinary.com',
    'https://upload-widget.cloudinary.com'
  ];

  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// Setup mobile performance monitoring
const setupMobilePerformanceMonitoring = () => {
  if (typeof window === 'undefined') return;

  // Monitor form interaction timing
  let formStartTime: number;

  // Track when user starts interacting with form
  const handleFirstInteraction = () => {
    formStartTime = performance.now();
    document.removeEventListener('touchstart', handleFirstInteraction);
    document.removeEventListener('focusin', handleFirstInteraction);
  };

  document.addEventListener('touchstart', handleFirstInteraction, { once: true });
  document.addEventListener('focusin', handleFirstInteraction, { once: true });

  // Monitor Core Web Vitals for mobile
  if ('web-vital' in window) {
    // @ts-ignore
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    });
  }
};

// Optimize touch interactions for better responsiveness
const optimizeTouchInteractions = () => {
  if (typeof window === 'undefined') return;

  // Add fast tap optimization
  document.addEventListener('touchstart', () => {}, { passive: true });
  
  // Prevent zoom on double tap for form inputs
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      if (event.target instanceof HTMLElement && 
          (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT')) {
        event.preventDefault();
      }
    }
    lastTouchEnd = now;
  }, false);
};

// Setup viewport optimizations
const setupViewportOptimizations = () => {
  if (typeof window === 'undefined') return;

  // Optimize viewport for mobile forms
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );
  }

  // Handle safe area insets for notched devices
  if (CSS.supports('padding: env(safe-area-inset-top)')) {
    document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
    document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
  }
};

// Debounced form validation for mobile
export const createMobileFormValidator = (validateFn: () => void, delay = 500) => {
  let timeoutId: NodeJS.Timeout;
  
  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(validateFn, delay);
  };
};

// Mobile-optimized image loading
export const optimizeMobileImageLoading = () => {
  // Use Intersection Observer for lazy loading
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px'
  });

  return imageObserver;
};

// Performance monitoring utilities
export const trackMobileFormMetrics = {
  formStart: () => {
    performance.mark('form-start');
  },
  
  formComplete: () => {
    performance.mark('form-complete');
    performance.measure('form-duration', 'form-start', 'form-complete');
    
    const measures = performance.getEntriesByName('form-duration');
    if (measures.length > 0) {
      console.log(`📱 Form completion time: ${Math.round(measures[0].duration)}ms`);
    }
  },
  
  trackFieldFocus: (fieldName: string) => {
    performance.mark(`field-focus-${fieldName}`);
  },
  
  trackFieldBlur: (fieldName: string) => {
    performance.mark(`field-blur-${fieldName}`);
    performance.measure(`field-time-${fieldName}`, `field-focus-${fieldName}`, `field-blur-${fieldName}`);
  }
};