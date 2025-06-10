// Дополнительные функции для добавления в ваш существующий performanceUtils.ts

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
