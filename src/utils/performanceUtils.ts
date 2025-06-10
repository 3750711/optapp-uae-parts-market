
// Performance utilities for optimized logging and caching
const isDevelopment = process.env.NODE_ENV === 'development';

// Conditional logging - only in development
export const devLog = (...args: any[]) => {
  if (isDevelopment) {
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

// Admin rights caching
const ADMIN_CACHE_KEY = 'admin_rights_cache';
const ADMIN_CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

interface AdminCacheData {
  isAdmin: boolean;
  timestamp: number;
  userId: string;
}

export const getCachedAdminRights = (userId: string): boolean | null => {
  try {
    const cached = sessionStorage.getItem(ADMIN_CACHE_KEY);
    if (!cached) return null;

    const data: AdminCacheData = JSON.parse(cached);
    
    // Check if cache is still valid and for the same user
    if (
      data.userId === userId &&
      Date.now() - data.timestamp < ADMIN_CACHE_DURATION
    ) {
      return data.isAdmin;
    }
    
    // Clear expired cache
    sessionStorage.removeItem(ADMIN_CACHE_KEY);
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
    sessionStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error setting admin cache:', error);
  }
};

export const clearAdminCache = (): void => {
  try {
    sessionStorage.removeItem(ADMIN_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing admin cache:', error);
  }
};

// Debounce utility for admin checks
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
