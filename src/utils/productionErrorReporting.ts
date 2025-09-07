import { supabase } from "@/integrations/supabase/client";

// Система мониторинга ошибок для продакшена
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
  endpoint: string;
}

class ProductionErrorReporting {
  private config: ErrorReportingConfig = {
    enabled: false, // 🚫 TEMPORARILY DISABLED for Safe Baseline
    maxReportsPerSession: 50,
    batchSize: 10,
    flushInterval: 30000, // 30 seconds
    endpoint: 'error-reports' // Use relative endpoint for supabase.functions.invoke
  };

  private errorQueue: ErrorReport[] = [];
  private sessionErrorCount = 0;
  private sessionId = this.generateSessionId();
  private flushTimer?: number;
  private isFlushing = false; // Исправлена опечатка

  constructor() {
    if (this.config.enabled && typeof window !== 'undefined') {
      this.setupErrorListeners();
      this.startBatchFlush();
      console.log('🔍 Production error reporting initialized');
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
        message: event.message || 'Unknown error',
        stack: event.error?.stack,
        severity: 'high',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: 'javascript_error'
        }
      });
    });

    // Необработанные promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      this.reportError({
        message: `Unhandled Promise Rejection: ${reason?.message || reason}`,
        stack: reason?.stack,
        severity: 'high',
        context: {
          type: 'unhandled_promise_rejection',
          reason: String(reason)
        }
      });
    });

    // Кастомные критические ошибки
    window.addEventListener('critical-error', ((event: CustomEvent) => {
      const { message, stack, context } = event.detail;
      this.reportError({
        message,
        stack,
        severity: 'critical',
        context: {
          ...context,
          type: 'custom_critical_error'
        }
      });
    }) as EventListener);
  }

  private startBatchFlush() {
    if (typeof window === 'undefined') return;
    
    this.flushTimer = window.setInterval(() => {
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

    // Фильтруем известные неопасные ошибки
    if (this.shouldIgnoreError(options.message)) {
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

  private shouldIgnoreError(message: string): boolean {
    const ignoredPatterns = [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Script error.',
      'Network request failed', // Игнорируем сетевые ошибки
      'Loading chunk', // Игнорируем ошибки загрузки чанков (обрабатываются отдельно)
    ];

    return ignoredPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private async flushErrors() {
    if (this.errorQueue.length === 0 || this.isFlushing) return;

    this.isFlushing = true; // Исправлена опечатка
    const batch = this.errorQueue.splice(0, this.config.batchSize);
    
    try {
      await this.sendErrorBatch(batch);
    } catch (error) {
      console.warn('Failed to send error reports:', error);
      // Возвращаем ошибки в очередь для повторной попытки
      this.errorQueue.unshift(...batch);
    } finally {
      this.isFlushing = false; // Исправлена опечатка
    }
  }

  private async sendErrorBatch(errors: ErrorReport[]) {
    const { data, error } = await supabase.functions.invoke('error-reports', {
      body: {
        errors,
        clientInfo: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          timestamp: Date.now(),
          sessionId: this.sessionId
        }
      }
    });

    if (error) {
      throw new Error(`Error reporting failed: ${error.message || 'invoke error'}`);
    }

    console.log('📊 Error reports sent:', data);
  }

  public getSessionStats() {
    return {
      sessionId: this.sessionId,
      errorCount: this.sessionErrorCount,
      queueLength: this.errorQueue.length,
      enabled: this.config.enabled
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
export const productionErrorReporting = new ProductionErrorReporting();

// Утилиты для использования в коде
export const reportError = (error: Error | string, context?: Record<string, any>) => {
  const message = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'object' ? error.stack : undefined;
  
  productionErrorReporting.reportError({
    message,
    stack,
    severity: 'medium',
    context,
  });
};

export const reportCriticalError = (error: Error | string, context?: Record<string, any>) => {
  const message = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'object' ? error.stack : undefined;
  
  productionErrorReporting.reportError({
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
      productionErrorReporting.destroy();
    } catch (e) {
      // no-op
    }
  };
  window.addEventListener('pagehide', onHide);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onHide();
  });
}

