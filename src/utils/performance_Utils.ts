// Утилиты для производительности и отладки

// Условное логирование только в development
export const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[DEV]', ...args);
  }
};

export const devError = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('[DEV ERROR]', ...args);
  } else {
    // В продакшене логируем только критические ошибки
    console.error(...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[DEV WARN]', ...args);
  }
};

// Измерение времени выполнения
export const measureTime = (label: string) => {
  const start = performance.now();
  return {
    end: () => {
      const end = performance.now();
      devLog(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
      return end - start;
    }
  };
};

// Debounce функция для оптимизации
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

// Throttle функция
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

// Проверка поддержки Web Vitals
export const checkWebVitalsSupport = () => {
  return 'PerformanceObserver' in window && 'PerformanceEntry' in window;
};

// Простой мониторинг производительности
export const monitorPerformance = () => {
  if (!checkWebVitalsSupport() || process.env.NODE_ENV !== 'development') {
    return;
  }

  // Мониторинг времени загрузки
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    devLog('📊 Performance metrics:', {
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
            devWarn(`🐌 Long task detected: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      devError('Failed to setup performance observer:', error);
    }
  }
};

// Проверка размера бандла
export const logBundleInfo = () => {
  if (process.env.NODE_ENV === 'development') {
    // Приблизительная оценка размера загруженного JS
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const totalScripts = scripts.length;
    devLog(`📦 Loaded ${totalScripts} script files`);
    
    // Информация о памяти (если доступно)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      devLog('🧠 Memory usage:', {
        'Used JS Heap': `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        'Total JS Heap': `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        'Heap Limit': `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });
    }
  }
};

// Оптимизация изображений
export const optimizeImageLoading = () => {
  // Lazy loading для изображений
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    // Находим все изображения с data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
};

// Предзагрузка критических ресурсов
export const preloadCriticalResources = () => {
  const criticalResources = [
    // Добавьте пути к критическим CSS/JS файлам
    '/assets/critical.css',
    // Критические шрифты
    '/fonts/main-font.woff2'
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

// Инициализация всех оптимизаций
export const initPerformanceOptimizations = () => {
  if (typeof window === 'undefined') return;
  
  monitorPerformance();
  logBundleInfo();
  
  // Запускаем оптимизации после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      optimizeImageLoading();
      preloadCriticalResources();
    });
  } else {
    optimizeImageLoading();
    preloadCriticalResources();
  }
};