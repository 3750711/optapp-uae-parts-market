interface RenderCounter {
  [componentName: string]: number;
}

interface PerformanceMetrics {
  renderCounts: RenderCounter;
  authContextLoadTime: number | null;
  cyclicalCallsDetected: boolean;
  lastCyclicalCallTimestamp: number | null;
}

// ✅ ИЗМЕНЕНИЕ 1: Мониторинг всегда включен для сбора метрик
const PERFORMANCE_ENABLED = true; // Всегда включено для сбора метрик

// ✅ ИЗМЕНЕНИЕ 2: Умная отправка только критичных метрик
const sendMetricsToBackend = async (metrics: PerformanceMetrics) => {
  // В DEV - не отправляем, только логируем в консоль
  if (import.meta.env.DEV) {
    return;
  }

  // В PROD - отправляем только если есть критичные метрики
  const hasCriticalMetrics = 
    Object.values(metrics.renderCounts).some(count => count > 15) ||
    (metrics.authContextLoadTime && metrics.authContextLoadTime > 5000) ||
    metrics.cyclicalCallsDetected;

  if (!hasCriticalMetrics) {
    return; // Нормальные метрики - не отправляем
  }

  // Отправляем критичные метрики
  try {
    await fetch('/api/performance-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...metrics,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        critical: true,
        severity: 'high'
      })
    });
    console.log('🚨 Critical performance metrics sent to backend');
  } catch (error) {
    // Игнорируем ошибки отправки метрик
    console.warn('Failed to send performance metrics:', error);
  }
};

// Глобальный объект для отслеживания производительности
export const performanceDiagnostics: PerformanceMetrics = {
  renderCounts: {},
  authContextLoadTime: null,
  cyclicalCallsDetected: false,
  lastCyclicalCallTimestamp: null
};

// ✅ ИЗМЕНЕНИЕ 3: Заменяем import.meta.env.DEV на PERFORMANCE_ENABLED
// Счетчик рендеров компонентов
export const trackRender = (componentName: string) => {
  if (PERFORMANCE_ENABLED) {
    performanceDiagnostics.renderCounts[componentName] = 
      (performanceDiagnostics.renderCounts[componentName] || 0) + 1;
    
    // Предупреждение о чрезмерном количестве рендеров
    if (performanceDiagnostics.renderCounts[componentName] > 10) {
      console.warn(`⚠️ ${componentName} rendered ${performanceDiagnostics.renderCounts[componentName]} times - possible performance issue`);
    }

    // ✅ В production отправляем критичные метрики
    if (import.meta.env.PROD && performanceDiagnostics.renderCounts[componentName] === 20) {
      console.warn(`🚨 Critical: ${componentName} rendered 20 times in production`);
      sendMetricsToBackend(performanceDiagnostics);
    }
  }
};

// Мониторинг времени загрузки AuthContext
export const startAuthTimer = () => {
  if (PERFORMANCE_ENABLED) {
    return performance.now();
  }
  return 0;
};

export const endAuthTimer = (startTime: number) => {
  if (PERFORMANCE_ENABLED) {
    performanceDiagnostics.authContextLoadTime = performance.now() - startTime;
    console.log(`⏱️ AuthContext load time: ${performanceDiagnostics.authContextLoadTime.toFixed(2)}ms`);
    
    // Отправляем если загрузка слишком долгая
    if (import.meta.env.PROD && performanceDiagnostics.authContextLoadTime > 5000) {
      sendMetricsToBackend(performanceDiagnostics);
    }
  }
};

// Обнаружение циклических вызовов
export const detectCyclicalCall = (functionName: string) => {
  if (PERFORMANCE_ENABLED) {
    const now = Date.now();
    const lastCall = performanceDiagnostics.lastCyclicalCallTimestamp;
    
    if (lastCall && (now - lastCall) < 100) { // Вызовы чаще чем раз в 100мс
      performanceDiagnostics.cyclicalCallsDetected = true;
      console.warn(`🔄 Cyclical call detected in ${functionName} - calls too frequent`);
      
      // Критичная ситуация в production
      if (import.meta.env.PROD) {
        sendMetricsToBackend(performanceDiagnostics);
      }
    }
    
    performanceDiagnostics.lastCyclicalCallTimestamp = now;
  }
};

// Получение отчета о производительности
export const getPerformanceReport = () => {
  if (PERFORMANCE_ENABLED) {
    console.group('📊 Performance Report');
    console.log('Render counts:', performanceDiagnostics.renderCounts);
    console.log('AuthContext load time:', performanceDiagnostics.authContextLoadTime + 'ms');
    console.log('Cyclical calls detected:', performanceDiagnostics.cyclicalCallsDetected);
    console.groupEnd();
  }
};

// Сброс счетчиков
export const resetPerformanceCounters = () => {
  if (PERFORMANCE_ENABLED) {
    performanceDiagnostics.renderCounts = {};
    performanceDiagnostics.cyclicalCallsDetected = false;
    performanceDiagnostics.lastCyclicalCallTimestamp = null;
    console.log('🔄 Performance counters reset');
  }
};

// ✅ ИЗМЕНЕНИЕ 4: Периодическая отправка критичных метрик в production (каждые 5 минут)
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  setInterval(() => {
    // sendMetricsToBackend сама проверит критичность
    sendMetricsToBackend(performanceDiagnostics);
  }, 5 * 60 * 1000); // Каждые 5 минут
}