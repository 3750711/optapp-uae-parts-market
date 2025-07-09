/**
 * Production optimization utilities for better performance and user experience
 */

const isDevelopment = import.meta.env.DEV;

// Conditional logging - only in development
export const devLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log('[DEV]', ...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (isDevelopment) {
    console.warn('[DEV]', ...args);
  }
};

// Critical error logging for production monitoring
export const criticalError = (error: Error | string, context?: Record<string, any>) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  // Only log critical errors in production
  console.error('[CRITICAL]', errorMessage);
  
  // In development, also log context and stack
  if (isDevelopment && context) {
    console.error('[DEV] Context:', context);
    if (typeof error === 'object' && error.stack) {
      console.error('[DEV] Stack:', error.stack);
    }
  }
};

// Performance measurement utility
export const measurePerformance = (label: string) => {
  if (!isDevelopment) return { end: () => {} };
  
  const start = performance.now();
  return {
    end: () => {
      const end = performance.now();
      const duration = end - start;
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
      return duration;
    }
  };
};

// Optimized image loading with error handling
export const optimizeImageLoad = (src: string, fallback?: string): string => {
  if (!src) return fallback || '/placeholder.svg';
  
  // Add loading optimization parameters for better performance
  if (src.includes('supabase') || src.includes('cloudinary')) {
    const url = new URL(src);
    if (!url.searchParams.has('q') && !url.searchParams.has('quality')) {
      url.searchParams.set('q', '80'); // 80% quality for better performance
    }
    return url.toString();
  }
  
  return src;
};

// Debounced scroll handler for better performance
export const createOptimizedScrollHandler = (callback: () => void, delay = 100) => {
  let timeoutId: NodeJS.Timeout;
  let isThrottled = false;

  return () => {
    if (isThrottled) return;
    
    isThrottled = true;
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      callback();
      isThrottled = false;
    }, delay);
  };
};

// Memory-efficient intersection observer
export const createOptimizedIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  return new IntersectionObserver(callback, defaultOptions);
};