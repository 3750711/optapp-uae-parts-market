
// Performance utilities for optimized logging and caching
const isDevelopment = process.env.NODE_ENV === 'development';

// Minimal logging - completely disabled in production
export const devLog = (...args: any[]) => {
  // Completely disable in production for better performance
  if (!isDevelopment) return;
  
  // Even in development, only log critical information
  if (args[0]?.includes?.('AdminGuard') || args[0]?.includes?.('AuthContext')) {
    console.log(...args);
  }
};

export const devError = (...args: any[]) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

// Performance monitoring
export const perfMark = (name: string) => {
  if (isDevelopment && typeof performance !== 'undefined') {
    performance.mark(name);
  }
};

export const perfMeasure = (name: string, startMark: string, endMark: string) => {
  if (isDevelopment && typeof performance !== 'undefined') {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      console.log(`⚡ ${name}: ${measure.duration.toFixed(2)}ms`);
    } catch (error) {
      // Silently fail if marks don't exist
    }
  }
};

// Optimized admin rights caching with memory cache
const ADMIN_CACHE_KEY = 'admin_rights_cache';
const ADMIN_CACHE_DURATION = 1000 * 60 * 15; // Reduced to 15 minutes

interface AdminCacheData {
  isAdmin: boolean;
  timestamp: number;
  userId: string;
}

// In-memory cache for faster access
const memoryCache = new Map<string, AdminCacheData>();

export const getCachedAdminRights = (userId: string): boolean | null => {
  try {
    // Check memory cache first
    const memoryKey = `admin_${userId}`;
    const memoryCached = memoryCache.get(memoryKey);
    
    if (memoryCached && Date.now() - memoryCached.timestamp < ADMIN_CACHE_DURATION) {
      return memoryCached.isAdmin;
    }

    // Fallback to sessionStorage
    const cached = sessionStorage.getItem(ADMIN_CACHE_KEY);
    if (!cached) return null;

    const data: AdminCacheData = JSON.parse(cached);
    
    if (
      data.userId === userId &&
      Date.now() - data.timestamp < ADMIN_CACHE_DURATION
    ) {
      // Update memory cache
      memoryCache.set(memoryKey, data);
      return data.isAdmin;
    }
    
    // Clear expired cache
    sessionStorage.removeItem(ADMIN_CACHE_KEY);
    memoryCache.delete(memoryKey);
    return null;
  } catch (error) {
    console.error('Error reading admin cache:', error);
    return null;
  }
};

export const setCachedAdminRights = (userId: string, isAdmin: boolean): void => {
  try {
    const data: AdminCacheData = {
      isAdmin,
      timestamp: Date.now(),
      userId
    };
    
    // Set in memory cache immediately
    const memoryKey = `admin_${userId}`;
    memoryCache.set(memoryKey, data);
    
    // Async storage write to avoid blocking
    setTimeout(() => {
      try {
        sessionStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(data));
      } catch (error) {
        console.error('Error setting admin cache:', error);
      }
    }, 0);
  } catch (error) {
    console.error('Error setting admin cache:', error);
  }
};

export const clearAdminCache = (): void => {
  try {
    // Clear memory cache
    memoryCache.clear();
    
    // Async clear storage
    setTimeout(() => {
      try {
        sessionStorage.removeItem(ADMIN_CACHE_KEY);
      } catch (error) {
        console.error('Error clearing admin cache:', error);
      }
    }, 0);
  } catch (error) {
    console.error('Error clearing admin cache:', error);
  }
};

// Optimized debounce with immediate cleanup
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  
  // Add cleanup method
  (debounced as any).cancel = () => clearTimeout(timeout);
  
  return debounced;
};
