
// Централизованная система логирования с условным выполнением
const isDevelopment = process.env.NODE_ENV === 'development';

// Счетчики для throttling
const logCounts = new Map<string, number>();
const LOG_THROTTLE_LIMIT = 100;

// Функции для development логирования
export const devLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

export const devError = (...args: any[]) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

// Throttled logging для избежания спама в development
export const throttledDevLog = (key: string, ...args: any[]) => {
  if (!isDevelopment) return;
  
  const count = logCounts.get(key) || 0;
  if (count < LOG_THROTTLE_LIMIT) {
    console.log(...args);
    logCounts.set(key, count + 1);
  } else if (count === LOG_THROTTLE_LIMIT) {
    console.log(`🔕 Further "${key}" logs suppressed (${LOG_THROTTLE_LIMIT}+ calls)`);
    logCounts.set(key, count + 1);
  }
};

// Критические ошибки для production
export const prodError = (error: Error | string, context?: Record<string, any>) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'object' ? error.stack : undefined;
  
  // Всегда логируем критические ошибки
  console.error('🚨 Critical Error:', errorMessage, context);
  
  // В production отправляем в мониторинг
  if (!isDevelopment && typeof window !== 'undefined') {
    try {
      // Интеграция с error monitoring
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: errorMessage,
          fatal: true,
          custom_map: context
        });
      }
      
      // Отправка в error reporting service
      const errorEvent = new CustomEvent('critical-error', {
        detail: { message: errorMessage, stack, context, timestamp: Date.now() }
      });
      window.dispatchEvent(errorEvent);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }
};

// Performance logging
export const perfStart = (label: string) => {
  if (isDevelopment && typeof performance !== 'undefined') {
    performance.mark(`${label}-start`);
  }
};

export const perfEnd = (label: string) => {
  if (isDevelopment && typeof performance !== 'undefined') {
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

// Сброс счетчиков (для длительных сессий)
export const resetLogCounters = () => {
  logCounts.clear();
};

// Статистика логирования (только в development)
export const getLogStats = () => {
  if (!isDevelopment) return {};
  return Object.fromEntries(logCounts);
};
