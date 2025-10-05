interface RenderCounter {
  [componentName: string]: number;
}

interface PerformanceMetrics {
  renderCounts: RenderCounter;
  authContextLoadTime: number | null;
  cyclicalCallsDetected: boolean;
  lastCyclicalCallTimestamp: number | null;
}

// Глобальный объект для отслеживания производительности
export const performanceDiagnostics: PerformanceMetrics = {
  renderCounts: {},
  authContextLoadTime: null,
  cyclicalCallsDetected: false,
  lastCyclicalCallTimestamp: null
};

// Счетчик рендеров компонентов
export const trackRender = (componentName: string) => {
  if (import.meta.env.DEV) {
    performanceDiagnostics.renderCounts[componentName] = 
      (performanceDiagnostics.renderCounts[componentName] || 0) + 1;
    
    // Предупреждение о чрезмерном количестве рендеров
    if (performanceDiagnostics.renderCounts[componentName] > 10) {
      console.warn(`⚠️ ${componentName} rendered ${performanceDiagnostics.renderCounts[componentName]} times - possible performance issue`);
    }
  }
};

// Мониторинг времени загрузки AuthContext
export const startAuthTimer = () => {
  if (import.meta.env.DEV) {
    return performance.now();
  }
  return 0;
};

export const endAuthTimer = (startTime: number) => {
  if (import.meta.env.DEV) {
    performanceDiagnostics.authContextLoadTime = performance.now() - startTime;
    console.log(`⏱️ AuthContext load time: ${performanceDiagnostics.authContextLoadTime.toFixed(2)}ms`);
  }
};

// Обнаружение циклических вызовов
export const detectCyclicalCall = (functionName: string) => {
  if (import.meta.env.DEV) {
    const now = Date.now();
    const lastCall = performanceDiagnostics.lastCyclicalCallTimestamp;
    
    if (lastCall && (now - lastCall) < 100) { // Вызовы чаще чем раз в 100мс
      performanceDiagnostics.cyclicalCallsDetected = true;
      console.warn(`🔄 Cyclical call detected in ${functionName} - calls too frequent`);
    }
    
    performanceDiagnostics.lastCyclicalCallTimestamp = now;
  }
};

// Получение отчета о производительности
export const getPerformanceReport = () => {
  if (import.meta.env.DEV) {
    console.group('📊 Performance Report');
    console.log('Render counts:', performanceDiagnostics.renderCounts);
    console.log('AuthContext load time:', performanceDiagnostics.authContextLoadTime + 'ms');
    console.log('Cyclical calls detected:', performanceDiagnostics.cyclicalCallsDetected);
    console.groupEnd();
  }
};

// Сброс счетчиков
export const resetPerformanceCounters = () => {
  if (import.meta.env.DEV) {
    performanceDiagnostics.renderCounts = {};
    performanceDiagnostics.cyclicalCallsDetected = false;
    performanceDiagnostics.lastCyclicalCallTimestamp = null;
    console.log('🔄 Performance counters reset');
  }
};