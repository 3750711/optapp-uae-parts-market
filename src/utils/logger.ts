
// Централизованная система логирования с условным выполнением
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Конфигурация логирования - отключаем все в production кроме критических ошибок
const LOG_CONFIG = {
  enableDevLogs: isDevelopment,
  enableProdCriticalOnly: isProduction,
  enablePerformanceLogs: false, // Отключено для production
  throttleEnabled: isDevelopment,
  maxLogHistory: isDevelopment ? 100 : 10
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

// Production error logging (только критические ошибки)
export const prodError = (error: Error | string, context?: Record<string, any>) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // В production логируем только в консоль без дополнительной обработки
  if (isProduction) {
    console.error('🚨 Critical Error:', errorMessage);
  } else {
    // В development логируем подробнее
    const stack = typeof error === 'object' ? error.stack : undefined;
    console.error('🔴 Error:', errorMessage, context, stack ? { stack } : {});
  }
};

// Критические ошибки (всегда активны, но упрощены)
export const criticalError = (error: Error | string, context?: Record<string, any>) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  console.error('🚨 Critical Error:', errorMessage);
};

// Performance logging (отключено в production)
export const perfStart = (label: string) => {
  // Полностью отключено
};

export const perfEnd = (label: string) => {
  // Полностью отключено
};

// Отключенная метрика производительности
export const trackMetric = (name: string, value: number, tags?: Record<string, string>) => {
  // Полностью отключено
};

// Throttled logging (только для development)
export const throttledDevLog = (key: string, ...args: any[]) => {
  if (LOG_CONFIG.enableDevLogs) {
    console.log(...args);
  }
};

// Заглушки для совместимости
export const resetLogCounters = () => {};
export const getLogStats = () => ({ disabled: 'production mode' });
