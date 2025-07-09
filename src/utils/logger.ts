
// Централизованная система логирования с отключением в production
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Конфигурация логирования - полностью отключено в production
const LOG_CONFIG = {
  enableDevLogs: isDevelopment,
  enableProdLogs: false, // Полностью отключено в production
  enablePerformanceLogs: false,
  throttleEnabled: false,
  maxLogHistory: isDevelopment ? 50 : 0
};

// Development логирование (полностью отключено в production)
export const devLog = (...args: any[]) => {
  if (LOG_CONFIG.enableDevLogs && isDevelopment) {
    console.log('[DEV]', ...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (LOG_CONFIG.enableDevLogs && isDevelopment) {
    console.warn('[DEV]', ...args);
  }
};

export const devError = (...args: any[]) => {
  if (LOG_CONFIG.enableDevLogs && isDevelopment) {
    console.error('[DEV]', ...args);
  }
};

// Production error logging (только критические ошибки)
export const prodError = (error: Error | string, context?: Record<string, any>) => {
  if (isProduction) {
    // В production логируем только критические ошибки без дополнительной информации
    const errorMessage = typeof error === 'string' ? error : error.message;
    console.error('[PROD]', errorMessage);
  } else if (isDevelopment) {
    // В development логируем подробнее
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'object' ? error.stack : undefined;
    console.error('[DEV] Error:', errorMessage, context, stack ? { stack } : {});
  }
};

// Критические ошибки (минимальное логирование)
export const criticalError = (error: Error | string, context?: Record<string, any>) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  console.error('[CRITICAL]', errorMessage);
};

// Performance logging (полностью отключено)
export const perfStart = (label: string) => {
  // Отключено для производительности
};

export const perfEnd = (label: string) => {
  // Отключено для производительности
};

// Отключенная метрика производительности
export const trackMetric = (name: string, value: number, tags?: Record<string, string>) => {
  // Отключено
};

// Throttled logging (только для development)
export const throttledDevLog = (key: string, ...args: any[]) => {
  if (isDevelopment && LOG_CONFIG.enableDevLogs) {
    console.log(...args);
  }
};

// Заглушки для совместимости
export const resetLogCounters = () => {};
export const getLogStats = () => ({ disabled: 'production mode' });
