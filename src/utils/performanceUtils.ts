// Дополнительные функции для добавления в ваш существующий performanceUtils.ts

// Environment check
const isDevelopment = process.env.NODE_ENV === 'development';

// Development logging functions
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

// Performance marking functions
export const perfMark = (name: string) => {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
};

export const perfMeasure = (name: string, startMark: string, endMark: string) => {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      if (isDevelopment) {
        const measure = performance.getEntriesByName(name, 'measure')[0];
        if (measure) {
          console.log(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`);
        }
      }
    } catch (error) {
      devError('Failed to measure performance:', error);
    }
  }
};

// Admin cache functions
const ADMIN_CACHE_KEY = 'admin_rights_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface AdminCacheData {
  isAdmin: boolean;
  timestamp: number;
  userId: string;
}

export const getCachedAdminRights = (userId: string): boolean | null => {
  if (typeof window === 'undefined') return null;
  
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
    devError('Failed to get cached admin rights:', error);
    return null;
  }
};

export const setCachedAdminRights = (userId: string, isAdmin: boolean): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const data: AdminCacheData = {
      isAdmin,
      timestamp: Date.now(),
      userId
    };
    localStorage.setItem(`${ADMIN_CACHE_KEY}_${userId}`, JSON.stringify(data));
  } catch (error) {
    devError('Failed to cache admin rights:', error);
  }
};

export const clearAdminCache = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(ADMIN_CACHE_KEY)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    devError('Failed to clear admin cache:', error);
  }
};

// Throttle функция для ограничения частоты вызовов
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

// Измерение времени выполнения
export const measureTime = (label: string) => {
  const start = performance.now();
  return {
    end: () => {
      const end = performance.now();
      if (isDevelopment) {
        console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
      }
      return end - start;
    }
  };
};

// Простой мониторинг производительности
export const monitorPerformance = () => {
  if (!isDevelopment || typeof window === 'undefined') return;

  // Мониторинг времени загрузки
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    console.log('📊 Performance metrics:', {
      'DOM Content Loaded': `${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`,
      'Load Complete': `${navigation.loadEventEnd - navigation.loadEventStart}ms`,
      'Total Load Time': `${navigation.loadEventEnd - navigation.fetchStart}ms`
    });
  });

  // Мониторинг больших задач
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Задачи дольше 50ms
            console.warn(`🐌 Long task detected: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      devError('Failed to setup performance observer:', error);
    }
  }
};

// Предзагрузка критических ресурсов
export const preloadCriticalResources = () => {
  if (typeof window === 'undefined') return;
  
  const criticalResources = [
    // Добавьте пути к критическим ресурсам вашего приложения
    // '/assets/critical.css',
    // '/fonts/main-font.woff2'
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    
    if (resource.endsWith('.css')) {
      link.as = 'style';
    } else if (resource.endsWith('.js')) {
      link.as = 'script';
    } else if (resource.includes('font')) {
      link.as = 'font';
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
  });
};

// Инициализация всех оптимизаций производительности
export const initPerformanceOptimizations = () => {
  if (typeof window === 'undefined') return;
  
  monitorPerformance();
  
  // Запускаем оптимизации после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      preloadCriticalResources();
    });
  } else {
    preloadCriticalResources();
  }
};
