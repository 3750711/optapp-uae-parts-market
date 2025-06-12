
// Глобальные типы для аналитики
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

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

// Chunk loading monitoring (адаптировано для Vite)
export const monitorChunkLoading = () => {
  if (!isDevelopment || typeof window === 'undefined') return;

  // Отслеживание ошибок загрузки чанков
  window.addEventListener('error', (event) => {
    if (event.filename && (event.filename.includes('chunk') || event.filename.includes('assets'))) {
      console.error('🚨 Chunk loading error:', {
        filename: event.filename,
        message: event.message,
        lineno: event.lineno,
        colno: event.colno
      });
      
      // Можно отправить метрику в аналитику
      if (typeof window.gtag !== 'undefined') {
        window.gtag('event', 'chunk_load_error', {
          error_filename: event.filename,
          error_message: event.message
        });
      }
    }
  });

  // Простое отслеживание загрузки модулей для Vite
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [resource] = args;
    
    if (typeof resource === 'string' && resource.includes('assets/')) {
      const startTime = performance.now();
      
      return originalFetch.apply(this, args)
        .then(response => {
          const endTime = performance.now();
          const loadTime = endTime - startTime;
          
          if (response.ok) {
            console.log(`📦 Asset loaded: ${resource.split('/').pop()} in ${loadTime.toFixed(2)}ms`);
          } else {
            console.error(`❌ Asset load failed: ${resource.split('/').pop()}`);
          }
          
          return response;
        })
        .catch(error => {
          console.error(`❌ Asset load error: ${resource.split('/').pop()}`, error);
          throw error;
        });
    }
    
    return originalFetch.apply(this, args);
  };
};

// Lazy loading metrics
export const trackLazyLoadTime = (componentName: string, loadTime: number) => {
  if (isDevelopment) {
    console.log(`📊 ${componentName} lazy load time: ${loadTime.toFixed(2)}ms`);
  }
  
  // Отправляем метрики в аналитику если доступно
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'lazy_component_load', {
      component_name: componentName,
      load_time: Math.round(loadTime),
      custom_map: {
        metric1: Math.round(loadTime)
      }
    });
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

// Query prefetching helpers
export const prefetchAdminData = async (queryClient: any) => {
  console.log('🔄 Prefetching admin data...');
  
  // Предзагружаем только критические данные для админ панели
  try {
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: ['admin', 'users', 'pending-count'],
        staleTime: 2 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: ['admin', 'metrics'],
        staleTime: 5 * 60 * 1000,
      })
    ]);
    console.log('✅ Admin data prefetched');
  } catch (error) {
    console.warn('⚠️ Failed to prefetch admin data:', error);
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
      const duration = end - start;
      if (isDevelopment) {
        console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
      }
      return duration;
    }
  };
};

// Улучшенный мониторинг производительности
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

  // Мониторинг chunk loading
  monitorChunkLoading();
};

// Предзагрузка критических ресурсов
export const preloadCriticalResources = () => {
  if (typeof window === 'undefined') return;
  
  const criticalResources = [
    // CSS файлы
    '/assets/index.css',
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
