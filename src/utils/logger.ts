
// Централизованная система логирования с условным выполнением
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Счетчики для throttling
const logCounts = new Map<string, number>();
const LOG_THROTTLE_LIMIT = 50; // Уменьшили лимит

// Конфигурация логирования
const LOG_CONFIG = {
  enableDevLogs: isDevelopment,
  enableProdCriticalOnly: isProduction,
  enablePerformanceLogs: isDevelopment,
  throttleEnabled: true,
  maxLogHistory: 100
};

// Функции для development логирования (отключены в production)
export const devLog = (...args: any[]) => {
  if (LOG_CONFIG.enableDevLogs) {
    console.log(...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (LOG_CONFIG.enableDevLogs) {
    console.warn(...args);
  }
};

export const devError = (...args: any[]) => {
  if (LOG_CONFIG.enableDevLogs) {
    console.error(...args);
  }
};

// Production error logging (критические ошибки для production)
export const prodError = (error: Error | string, context?: Record<string, any>) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'object' ? error.stack : undefined;
  
  // В production логируем только критические ошибки
  if (isProduction) {
    console.error('🚨 Production Error:', errorMessage, context);
  } else {
    // В development логируем подробнее
    console.error('🔴 Error:', errorMessage, context, stack ? { stack } : {});
  }
  
  // Отправляем в систему мониторинга если доступна
  if (typeof window !== 'undefined') {
    try {
      const errorEvent = new CustomEvent('production-error', {
        detail: { 
          message: errorMessage, 
          stack, 
          context, 
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        }
      });
      window.dispatchEvent(errorEvent);
    } catch (reportingError) {
      console.error('Failed to report production error:', reportingError);
    }
  }
};

// Throttled logging для избежания спама (только в development)
export const throttledDevLog = (key: string, ...args: any[]) => {
  if (!LOG_CONFIG.enableDevLogs || !LOG_CONFIG.throttleEnabled) return;
  
  const count = logCounts.get(key) || 0;
  if (count < LOG_THROTTLE_LIMIT) {
    console.log(...args);
    logCounts.set(key, count + 1);
  } else if (count === LOG_THROTTLE_LIMIT) {
    console.log(`🔕 Further "${key}" logs suppressed (${LOG_THROTTLE_LIMIT}+ calls)`);
    logCounts.set(key, count + 1);
  }
};

// Критические ошибки (всегда активны)
export const criticalError = (error: Error | string, context?: Record<string, any>) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'object' ? error.stack : undefined;
  
  // Критические ошибки логируются всегда
  console.error('🚨 Critical Error:', errorMessage, context);
  
  // Отправляем в внешние системы мониторинга
  if (typeof window !== 'undefined') {
    try {
      // Отправка в error monitoring
      const errorEvent = new CustomEvent('critical-error', {
        detail: { 
          message: errorMessage, 
          stack, 
          context, 
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        }
      });
      window.dispatchEvent(errorEvent);
    } catch (reportingError) {
      console.error('Failed to report critical error:', reportingError);
    }
  }
};

// Performance logging (только в development)
export const perfStart = (label: string) => {
  if (LOG_CONFIG.enablePerformanceLogs && typeof performance !== 'undefined') {
    performance.mark(`${label}-start`);
  }
};

export const perfEnd = (label: string) => {
  if (LOG_CONFIG.enablePerformanceLogs && typeof performance !== 'undefined') {
    try {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      const measure = performance.getEntriesByName(label, 'measure')[0];
      if (measure) {
        console.log(`⏱️ ${label}: ${measure.duration.toFixed(2)}ms`);
      }
    } catch (error) {
      console.warn(`Failed to measure performance for ${label}:`, error);
    }
  }
};

// Централизованная метрика производительности
export const trackMetric = (name: string, value: number, tags?: Record<string, string>) => {
  if (!LOG_CONFIG.enablePerformanceLogs) return;
  
  const metric = {
    name,
    value,
    tags,
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.pathname : ''
  };
  
  console.log(`📊 Metric: ${name} = ${value}`, metric);
  
  // Отправляем метрики в систему мониторинга
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('performance-metric', { detail: metric }));
  }
};

// Сброс счетчиков
export const resetLogCounters = () => {
  logCounts.clear();
};

// Статистика логирования
export const getLogStats = () => {
  if (!isDevelopment) return { disabled: 'production mode' };
  return {
    counters: Object.fromEntries(logCounts),
    config: LOG_CONFIG,
    totalLogs: Array.from(logCounts.values()).reduce((sum, count) => sum + count, 0)
  };
};
