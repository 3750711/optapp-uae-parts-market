
// Enhanced debounce function with cancellation support
export function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let abortController: AbortController | null = null;

  const debounced = (...args: Parameters<F>): void => {
    // Cancel previous request if it exists
    if (abortController) {
      abortController.abort();
    }

    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }

    timeout = setTimeout(() => {
      // Create new AbortController for current request
      abortController = new AbortController();
      
      // Execute the function
      const result = func(...args);
      if (result && typeof result.then === 'function') {
        result.catch((error: any) => {
          if (error.name !== 'AbortError') {
            console.warn('Debounced function error:', error);
          }
        });
      }
    }, waitFor);
  };

  // Add cancel method
  debounced.cancel = () => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  };

  return debounced;
}

// Enhanced throttle function with cancellation support
export function throttle<F extends (...args: any[]) => any>(func: F, limit: number) {
  let inThrottle: boolean = false;
  let lastFunc: ReturnType<typeof setTimeout> | null = null;
  let lastRan: number = 0;

  const throttled = (...args: Parameters<F>): void => {
    if (!inThrottle) {
      func(...args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      if (lastFunc) {
        clearTimeout(lastFunc);
      }
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };

  throttled.cancel = () => {
    if (lastFunc) {
      clearTimeout(lastFunc);
      lastFunc = null;
    }
    inThrottle = false;
  };

  return throttled;
}
