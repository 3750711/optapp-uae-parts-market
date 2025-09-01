/**
 * Mobile form optimizations to prevent scroll-linked effects and improve performance
 */

// Detect problematic devices/browsers for scroll-linked effects
export const isProblematicDevice = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isOldAndroid = /android/.test(userAgent) && !/chrome\/[6-9][0-9]/.test(userAgent);
  const isFirefox = /firefox/.test(userAgent);
  
  return isIOS || isOldAndroid || isFirefox;
};

// Initialize mobile form optimizations
export const initMobileFormOptimizations = () => {
  if (typeof window === 'undefined') return;
  
  // Apply scroll optimizations to document
  if (isProblematicDevice()) {
    document.documentElement.style.setProperty('scroll-behavior', 'auto');
    document.body.style.setProperty('overscroll-behavior', 'contain');
  }
  
  // Add performance optimization classes
  document.body.classList.add('mobile-optimized');
};

// Mobile form metrics tracking
export const trackMobileFormMetrics = {
  formStart: () => {
    console.log('📱 Mobile form started');
  },
  formComplete: () => {
    console.log('📱 Mobile form completed');
  },
  uploadStart: () => {
    console.log('📱 Mobile upload started');
  },
  uploadComplete: () => {
    console.log('📱 Mobile upload completed');
  }
};

// Conditionally disable scroll-linked effects
export const disableScrollLinkedEffects = (element: HTMLElement) => {
  if (isProblematicDevice()) {
    element.style.setProperty('-webkit-overflow-scrolling', 'auto');
    element.style.setProperty('scroll-behavior', 'auto');
    element.style.setProperty('overscroll-behavior', 'contain');
  }
};

// Enable performance optimizations for elements
export const enablePerformanceOptimizations = (element: HTMLElement) => {
  element.style.setProperty('contain', 'layout style paint');
  element.style.setProperty('transform', 'translateZ(0)'); // Force hardware acceleration
};

// Cleanup performance optimizations
export const cleanupPerformanceOptimizations = (element: HTMLElement) => {
  element.style.removeProperty('will-change');
  element.style.removeProperty('contain');
  element.style.removeProperty('transform');
};

// Debounced viewport handler
export const createDebouncedViewportHandler = (callback: () => void, delay: number = 150) => {
  let timeoutId: NodeJS.Timeout;
  
  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };
};

// Safe scroll into view for mobile
export const safeScrollIntoView = (element: HTMLElement, options?: ScrollIntoViewOptions) => {
  if (isProblematicDevice()) {
    // Use simple scroll on problematic devices
    element.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  } else {
    element.scrollIntoView(options || { behavior: 'smooth', block: 'nearest' });
  }
};