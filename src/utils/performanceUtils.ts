
// Упрощенные утилиты производительности
const isDevelopment = import.meta.env.DEV;

// Performance marking (только в development)
export const perfMark = (name: string) => {
  // Отключено
};

export const perfMeasure = (name: string, startMark: string, endMark: string) => {
  // Отключено
};

// Chunk loading monitoring (упрощенный)
export const monitorChunkLoading = () => {
  if (!isDevelopment) return;
  
  // Минимальный мониторинг только в development
  window.addEventListener('error', (event) => {
    if (event.filename && event.filename.includes('chunk')) {
      console.error('Chunk loading error:', event.filename);
    }
  });
};

// Lazy loading metrics (отключено)
export const trackLazyLoadTime = (componentName: string, loadTime: number) => {
  // Отключено
};

// Admin cache functions (оптимизированы)
const ADMIN_CACHE_KEY = 'admin_rights_cache';
const CACHE_DURATION = 10 * 60 * 1000; // Увеличили до 10 минут

interface AdminCacheData {
  isAdmin: boolean;
  timestamp: number;
  userId: string;
}

export const getCachedAdminRights = (userId: string): boolean | null => {
  if (!isDevelopment || typeof localStorage === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(`${ADMIN_CACHE_KEY}_${userId}`);
    if (!cached) return null;
    
    const data: AdminCacheData = JSON.parse(cached);
    const now = Date.now();
    
    if (now - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(`${ADMIN_CACHE_KEY}_${userId}`);
      return null;
    }
    
    return data.isAdmin;
  } catch (error) {
    return null;
  }
};

export const setCachedAdminRights = (userId: string, isAdmin: boolean): void => {
  if (!isDevelopment || typeof localStorage === 'undefined') return;
  
  try {
    const data: AdminCacheData = {
      isAdmin,
      timestamp: Date.now(),
      userId
    };
    localStorage.setItem(`${ADMIN_CACHE_KEY}_${userId}`, JSON.stringify(data));
  } catch (error) {
    // Игнорируем ошибки записи
  }
};

export const clearAdminCache = (): void => {
  if (typeof localStorage === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(ADMIN_CACHE_KEY)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    // Игнорируем ошибки
  }
};

// Упрощенные функции
export const prefetchAdminData = async (queryClient: any) => {
  // Отключено для улучшения производительности
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const measureTime = (label: string) => {
  return {
    end: () => 0 // Отключено
  };
};

// Отключенные функции мониторинга
export const monitorPerformance = () => {};
export const preloadCriticalResources = () => {};
export const initPerformanceOptimizations = () => {};
