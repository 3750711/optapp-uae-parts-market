
// Централизованная система мониторинга ошибок для продакшена
interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

interface ErrorReportingConfig {
  enabled: boolean;
  maxReportsPerSession: number;
  batchSize: number;
  flushInterval: number;
}

class ErrorReportingService {
  private config: ErrorReportingConfig = {
    enabled: import.meta.env.PROD, // Исправлено: используем import.meta.env вместо process.env
    maxReportsPerSession: 50,
    batchSize: 10,
    flushInterval: 30000, // 30 секунд
  };

  private errorQueue: ErrorReport[] = [];
  private sessionErrorCount = 0;
  private sessionId = this.generateSessionId();
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    if (this.config.enabled && typeof window !== 'undefined') {
      this.setupErrorListeners();
      this.startBatchFlush();
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupErrorListeners() {
    if (typeof window === 'undefined') return;

    // Глобальные JavaScript ошибки
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        severity: 'high',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      });
    });

    // Необработанные promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        severity: 'high',
        context: {
          type: 'unhandledrejection',
          reason: event.reason,
        }
      });
    });

    // React Error Boundary ошибки (через кастомный event)
    window.addEventListener('react-error', ((event: CustomEvent) => {
      this.reportError({
        message: event.detail.message,
        stack: event.detail.stack,
        severity: 'critical',
        context: {
          type: 'react-error',
          componentStack: event.detail.componentStack,
        }
      });
    }) as EventListener);
  }

  private startBatchFlush() {
    this.flushTimer = setInterval(() => {
      this.flushErrors();
    }, this.config.flushInterval);
  }

  public reportError(options: {
    message: string;
    stack?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    context?: Record<string, any>;
    userId?: string;
  }) {
    if (!this.config.enabled || this.sessionErrorCount >= this.config.maxReportsPerSession) {
      return;
    }

    const report: ErrorReport = {
      message: options.message,
      stack: options.stack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: Date.now(),
      userId: options.userId,
      sessionId: this.sessionId,
      severity: options.severity || 'medium',
      context: options.context,
    };

    this.errorQueue.push(report);
    this.sessionErrorCount++;

    // Немедленная отправка критических ошибок
    if (report.severity === 'critical') {
      this.flushErrors();
    }
  }

  private async flushErrors() {
    if (this.errorQueue.length === 0) return;

    const batch = this.errorQueue.splice(0, this.config.batchSize);
    
    try {
      // Отправляем в Supabase или внешний сервис
      await this.sendErrorBatch(batch);
    } catch (error) {
      console.warn('Failed to send error reports:', error);
      // Возвращаем ошибки в очередь для повторной попытки
      this.errorQueue.unshift(...batch);
    }
  }

  private async sendErrorBatch(errors: ErrorReport[]) {
    // В продакшене можно отправлять в Supabase или внешний сервис
    const endpoint = '/api/error-reports'; // Настроить в соответствии с бэкендом
    
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ errors }),
      });
    } catch (error) {
      // Fallback: сохранить в localStorage для последующей отправки
      this.saveToLocalStorage(errors);
      throw error;
    }
  }

  private saveToLocalStorage(errors: ErrorReport[]) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    
    try {
      const existing = localStorage.getItem('pending_error_reports');
      const pendingErrors = existing ? JSON.parse(existing) : [];
      pendingErrors.push(...errors);
      
      // Ограничиваем размер
      if (pendingErrors.length > 100) {
        pendingErrors.splice(0, pendingErrors.length - 100);
      }
      
      localStorage.setItem('pending_error_reports', JSON.stringify(pendingErrors));
    } catch (error) {
      console.warn('Failed to save errors to localStorage:', error);
    }
  }

  public getSessionStats() {
    return {
      sessionId: this.sessionId,
      errorCount: this.sessionErrorCount,
      queueLength: this.errorQueue.length,
    };
  }

  public destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushErrors(); // Финальная отправка
  }
}

// Создаем глобальный экземпляр
export const errorReporting = new ErrorReportingService();

// Утилиты для использования в коде
export const reportError = (error: Error | string, context?: Record<string, any>) => {
  const message = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'object' ? error.stack : undefined;
  
  errorReporting.reportError({
    message,
    stack,
    severity: 'medium',
    context,
  });
};

export const reportCriticalError = (error: Error | string, context?: Record<string, any>) => {
  const message = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'object' ? error.stack : undefined;
  
  errorReporting.reportError({
    message,
    stack,
    severity: 'critical',
    context,
  });
};

// Очистка при скрытии/уходе со страницы (не блокируем bfcache)
if (typeof window !== 'undefined') {
  const onHide = () => {
    try {
      errorReporting.destroy();
    } catch (e) {
      // no-op
    }
  };
  // pagehide срабатывает при навигации/свертывании и сохраняет bfcache
  window.addEventListener('pagehide', onHide);
  // дублируем на visibilitychange для iOS случаев
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onHide();
  });
}

