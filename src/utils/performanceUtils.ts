
// Улучшенные утилиты производительности с оптимизированным кэшированием
const isDevelopment = import.meta.env.DEV;

// Performance marking (только в development)
export const perfMark = (name: string) => {
  if (isDevelopment && performance.mark) {
    performance.mark(name);
  }
};

export const perfMeasure = (name: string, startMark: string, endMark: string) => {
  if (isDevelopment && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
    } catch (error) {
      console.warn('Performance measure failed:', error);
    }
  }
};

// Оптимизированный мониторинг загрузки чанков
export const monitorChunkLoading = () => {
  if (!isDevelopment) return;
  
  window.addEventListener('error', (event) => {
    if (event.filename && event.filename.includes('chunk')) {
      console.error('Chunk loading error:', event.filename);
    }
  });
};

// Оптимизированное отслеживание lazy loading
export const trackLazyLoadTime = (componentName: string, loadTime: number) => {
  if (isDevelopment) {
    console.log(`🚀 ${componentName} loaded in ${loadTime}ms`);
  }
};

// Улучшенные функции кэширования админских прав с увеличенным временем жизни
const ADMIN_CACHE_KEY = 'admin_rights_cache';
const CACHE_DURATION = 30 * 60 * 1000; // Увеличили до 30 минут
const WRITE_THROTTLE_DURATION = 5000; // Ограничиваем запись в localStorage до 1 раза в 5 секунд

interface AdminCacheData {
  isAdmin: boolean;
  timestamp: number;
  userId: string;
}

// Throttle для записи в localStorage
const writeThrottleMap = new Map<string, number>();

export const getCachedAdminRights = (userId: string): boolean | null => {
  if (typeof localStorage === 'undefined') return null;
  
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
  if (typeof localStorage === 'undefined') return;
  
  // Throttle записи в localStorage
  const now = Date.now();
  const lastWrite = writeThrottleMap.get(userId) || 0;
  
  if (now - lastWrite < WRITE_THROTTLE_DURATION) {
    return; // Пропускаем запись если недавно уже писали
  }
  
  try {
    const data: AdminCacheData = {
      isAdmin,
      timestamp: now,
      userId
    };
    localStorage.setItem(`${ADMIN_CACHE_KEY}_${userId}`, JSON.stringify(data));
    writeThrottleMap.set(userId, now);
  } catch (error) {
    console.warn('Failed to cache admin rights:', error);
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
    writeThrottleMap.clear();
  } catch (error) {
    console.warn('Failed to clear admin cache:', error);
  }
};

// Улучшенная функция предзагрузки данных админа
export const prefetchAdminData = async (queryClient: any) => {
  if (!isDevelopment) return;
  
  try {
    // Предзагружаем критически важные данные для админов
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['admin-buyers'],
        queryFn: async () => {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data } = await supabase
            .from('profiles')
            .select('id, full_name, opt_id')
            .eq('user_type', 'buyer')
            .limit(50);
          return data || [];
        },
        staleTime: CACHE_DURATION,
      }),
    ]);
  } catch (error) {
    console.warn('Admin data prefetch failed:', error);
  }
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
  if (!isDevelopment) return;
  
  // Мониторинг FCP и LCP
  if ('web-vitals' in window || typeof PerformanceObserver !== 'undefined') {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint') {
            console.log(`🎨 ${entry.name}: ${entry.startTime.toFixed(2)}ms`);
          }
        }
      });
      observer.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }
  }
};

export const preloadCriticalResources = () => {
  if (typeof document === 'undefined') return;
  
  // Предзагружаем критические ресурсы
  const criticalImages = [
    '/favicon.ico',
  ];
  
  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
};

export const initPerformanceOptimizations = () => {
  if (isDevelopment) {
    monitorPerformance();
    monitorChunkLoading();
  }
  preloadCriticalResources();
};
