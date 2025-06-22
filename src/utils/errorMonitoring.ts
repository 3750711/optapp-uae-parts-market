
import { criticalError, devError } from '@/utils/logger';

// Упрощенная система мониторинга ошибок
interface ErrorMetrics {
  totalErrors: number;
  criticalErrors: number;
  lastError: Date | null;
}

class CentralizedErrorMonitor {
  private metrics: ErrorMetrics = {
    totalErrors: 0,
    criticalErrors: 0,
    lastError: null
  };

  private readonly MAX_CRITICAL_ERRORS = 10;

  constructor() {
    if (import.meta.env.DEV) {
      this.setupErrorListeners();
    }
  }

  private setupErrorListeners() {
    // Только в development
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message));
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason));
    });
  }

  handleError(error: Error, context?: Record<string, any>) {
    this.metrics.totalErrors++;
    this.metrics.lastError = new Date();

    // Только критические ошибки в production
    if (this.isCriticalError(error)) {
      this.handleCriticalError(error, context);
    }
  }

  private isCriticalError(error: Error): boolean {
    return error.message.includes('ChunkLoadError') ||
           error.message.includes('Failed to fetch dynamically imported module') ||
           error.message.includes('Cannot read properties');
  }

  handleCriticalError(error: Error, context?: Record<string, any>) {
    this.metrics.criticalErrors++;
    criticalError(error, context);
  }

  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  getHealthStatus() {
    return {
      status: this.metrics.criticalErrors > 5 ? 'unhealthy' : 'healthy',
      recentErrors: 0,
      totalErrors: this.metrics.totalErrors,
      criticalErrors: this.metrics.criticalErrors,
      lastError: this.metrics.lastError
    };
  }

  reset() {
    this.metrics = {
      totalErrors: 0,
      criticalErrors: 0,
      lastError: null
    };
  }
}

// Экспортируем упрощенный экземпляр
export const centralErrorMonitor = new CentralizedErrorMonitor();

// Упрощенные утилиты
export const reportError = (error: Error, context?: Record<string, any>) => {
  if (import.meta.env.DEV) {
    centralErrorMonitor.handleError(error, context);
  }
};

export const reportCriticalError = (error: Error, context?: Record<string, any>) => {
  centralErrorMonitor.handleCriticalError(error, context);
};

export const getErrorMetrics = () => centralErrorMonitor.getMetrics();
export const getHealthStatus = () => centralErrorMonitor.getHealthStatus();
