
import { criticalError, devError, trackMetric } from '@/utils/logger';

// Централизованная система мониторинга ошибок
interface ErrorMetrics {
  totalErrors: number;
  criticalErrors: number;
  chunkLoadErrors: number;
  networkErrors: number;
  jsErrors: number;
  lastError: Date | null;
  errorHistory: ErrorLogEntry[];
}

interface ErrorLogEntry {
  message: string;
  stack?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  url: string;
}

class CentralizedErrorMonitor {
  private metrics: ErrorMetrics = {
    totalErrors: 0,
    criticalErrors: 0,
    chunkLoadErrors: 0,
    networkErrors: 0,
    jsErrors: 0,
    lastError: null,
    errorHistory: []
  };

  private readonly STORAGE_KEY = 'app_error_metrics';
  private readonly MAX_HISTORY = 50;
  private readonly MAX_CRITICAL_ERRORS = 5;

  constructor() {
    this.loadMetrics();
    this.setupErrorListeners();
    this.setupPeriodicCleanup();
  }

  private loadMetrics() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.metrics = {
          ...parsed,
          lastError: parsed.lastError ? new Date(parsed.lastError) : null,
          errorHistory: parsed.errorHistory.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          }))
        };
      }
    } catch (error) {
      devError('Failed to load error metrics:', error);
    }
  }

  private saveMetrics() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.metrics));
    } catch (error) {
      devError('Failed to save error metrics:', error);
    }
  }

  private setupErrorListeners() {
    // Global JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason), {
        type: 'unhandledrejection',
        reason: event.reason
      });
    });

    // Custom critical errors
    window.addEventListener('critical-error', ((event: CustomEvent) => {
      const { message, stack, context } = event.detail;
      this.handleCriticalError(new Error(message), context);
    }) as EventListener);

    // Performance metrics
    window.addEventListener('performance-metric', ((event: CustomEvent) => {
      this.trackPerformanceMetric(event.detail);
    }) as EventListener);
  }

  private setupPeriodicCleanup() {
    // Очистка старых записей каждые 10 минут
    setInterval(() => {
      this.cleanupOldEntries();
    }, 10 * 60 * 1000);
  }

  private cleanupOldEntries() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.metrics.errorHistory = this.metrics.errorHistory.filter(
      entry => entry.timestamp > oneHourAgo
    );
    this.saveMetrics();
  }

  private isChunkLoadError(error: Error): boolean {
    return error.message.includes('loading dynamically imported module') ||
           error.message.includes('Failed to fetch dynamically imported module') ||
           error.message.includes('Loading chunk') ||
           error.name === 'ChunkLoadError';
  }

  private isNetworkError(error: Error): boolean {
    return error.message.includes('fetch') ||
           error.message.includes('network') ||
           error.message.includes('connection') ||
           error.message.includes('Failed to fetch');
  }

  private getSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (this.isChunkLoadError(error)) return 'high';
    if (this.isNetworkError(error)) return 'medium';
    if (error.message.includes('Cannot read properties')) return 'high';
    if (error.message.includes('TypeError')) return 'medium';
    return 'low';
  }

  handleError(error: Error, context?: Record<string, any>) {
    const severity = this.getSeverity(error);
    
    this.metrics.totalErrors++;
    this.metrics.lastError = new Date();

    if (this.isChunkLoadError(error)) {
      this.metrics.chunkLoadErrors++;
    } else if (this.isNetworkError(error)) {
      this.metrics.networkErrors++;
    } else {
      this.metrics.jsErrors++;
    }

    // Добавляем в историю
    const entry: ErrorLogEntry = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      severity,
      context,
      url: window.location.href
    };

    this.metrics.errorHistory.unshift(entry);
    if (this.metrics.errorHistory.length > this.MAX_HISTORY) {
      this.metrics.errorHistory.pop();
    }

    // Отправляем метрики
    trackMetric('error_count', this.metrics.totalErrors);
    trackMetric(`${severity}_error_count`, 1);

    this.saveMetrics();

    // Критические действия для высокого уровня ошибок
    if (severity === 'high' || severity === 'critical') {
      this.handleCriticalError(error, context);
    }
  }

  handleCriticalError(error: Error, context?: Record<string, any>) {
    this.metrics.criticalErrors++;
    
    criticalError(error, {
      ...context,
      errorCount: this.metrics.totalErrors,
      criticalCount: this.metrics.criticalErrors
    });

    // Проверяем на превышение лимита критических ошибок
    if (this.metrics.criticalErrors >= this.MAX_CRITICAL_ERRORS) {
      this.triggerEmergencyProtocol(error);
    }
  }

  private triggerEmergencyProtocol(error: Error) {
    console.error('🆘 Emergency Protocol Activated - Too many critical errors');
    
    // Отправляем экстренное уведомление
    window.dispatchEvent(new CustomEvent('emergency-protocol', {
      detail: {
        reason: 'too_many_critical_errors',
        errorCount: this.metrics.criticalErrors,
        lastError: error.message
      }
    }));
  }

  private trackPerformanceMetric(metric: any) {
    // Логируем только важные метрики производительности
    if (metric.value > 1000) { // Медленные операции
      devError(`Slow operation detected: ${metric.name} took ${metric.value}ms`);
    }
  }

  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  getHealthStatus() {
    const recentErrors = this.metrics.errorHistory.filter(
      entry => entry.timestamp > new Date(Date.now() - 5 * 60 * 1000)
    ).length;

    return {
      status: recentErrors > 10 ? 'unhealthy' : recentErrors > 5 ? 'degraded' : 'healthy',
      recentErrors,
      totalErrors: this.metrics.totalErrors,
      criticalErrors: this.metrics.criticalErrors,
      lastError: this.metrics.lastError
    };
  }

  reset() {
    this.metrics = {
      totalErrors: 0,
      criticalErrors: 0,
      chunkLoadErrors: 0,
      networkErrors: 0,
      jsErrors: 0,
      lastError: null,
      errorHistory: []
    };
    this.saveMetrics();
  }
}

// Экспортируем глобальный экземпляр
export const centralErrorMonitor = new CentralizedErrorMonitor();

// Утилиты для использования в компонентах
export const reportError = (error: Error, context?: Record<string, any>) => {
  centralErrorMonitor.handleError(error, context);
};

export const reportCriticalError = (error: Error, context?: Record<string, any>) => {
  centralErrorMonitor.handleCriticalError(error, context);
};

export const getErrorMetrics = () => centralErrorMonitor.getMetrics();
export const getHealthStatus = () => centralErrorMonitor.getHealthStatus();
