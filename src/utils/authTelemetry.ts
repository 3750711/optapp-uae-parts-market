interface AuthTelemetryEvent {
  event: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  [key: string]: any;
}

class AuthTelemetry {
  private events: AuthTelemetryEvent[] = [];
  private sessionId: string;
  
  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupPerformanceMonitoring();
  }
  
  private generateSessionId(): string {
    return `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private setupPerformanceMonitoring() {
    // Мониторинг profile_fetch событий
    this.trackMetric('profile_fetch_rate', () => {
      const last2Min = Date.now() - (2 * 60 * 1000);
      const recentFetches = this.events.filter(e => 
        e.event === 'profile_fetch' && 
        e.source === 'network' && 
        e.timestamp > last2Min
      );
      return recentFetches.length;
    });
    
    // Мониторинг TOKEN_REFRESHED частоты
    this.trackMetric('token_refresh_rate', () => {
      const last1Min = Date.now() - (60 * 1000);
      const recentRefreshes = this.events.filter(e => 
        e.event === 'token_refresh' && 
        e.timestamp > last1Min
      );
      return recentRefreshes.length;
    });
  }
  
  log(event: string, data: Record<string, any> = {}) {
    const eventData: AuthTelemetryEvent = {
      event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...data
    };
    
    this.events.push(eventData);
    
    // Лимит событий в памяти
    if (this.events.length > 100) {
      this.events = this.events.slice(-50);
    }
    
    // Dev режим - в консоль
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Auth Telemetry [${event}]:`, eventData);
    }
    
    // Проверяем алерты
    this.checkAlerts(eventData);
    
    // Production - можно отправлять в Sentry/другую систему
    this.sendToExternalService(eventData);
  }
  
  private checkAlerts(event: AuthTelemetryEvent) {
    switch (event.event) {
      case 'profile_fetch':
        if (event.source === 'network') {
          const profileFetchRate = this.getMetric('profile_fetch_rate');
          if (profileFetchRate > 1) {
            this.alert('profile_fetch_burst', {
              rate: profileFetchRate,
              threshold: 1,
              message: 'Превышен лимит загрузок профиля (>1 за 2 минуты)'
            });
          }
        }
        break;
        
      case 'token_refresh':
        const refreshRate = this.getMetric('token_refresh_rate');
        if (refreshRate > 3) {
          this.alert('refresh_cycle_detected', {
            rate: refreshRate,
            threshold: 3,
            message: 'Обнаружен цикл обновления токенов (>3 за минуту)'
          });
        }
        break;
        
      case 'admin_verify_call':
        // Считаем verify_call без мутаций за последние 10 сек
        const last10Sec = Date.now() - (10 * 1000);
        const recentVerifies = this.events.filter(e => 
          e.event === 'admin_verify_call' && 
          e.timestamp > last10Sec &&
          e.method !== 'POST' && e.method !== 'PUT' && e.method !== 'DELETE'
        );
        
        if (recentVerifies.length > 3) {
          this.alert('admin_verify_spam', {
            count: recentVerifies.length,
            threshold: 3,
            message: 'Слишком много проверок админ доступа (>3 за 10 сек)'
          });
        }
        break;
    }
  }
  
  private alert(alertType: string, data: Record<string, any>) {
    const alertEvent = {
      event: 'alert',
      alertType,
      ...data,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };
    
    console.warn(`🚨 Auth Alert [${alertType}]:`, alertEvent);
    
    // В production отправляем критичные алерты
    if (process.env.NODE_ENV === 'production') {
      this.sendCriticalAlert(alertEvent);
    }
  }
  
  private trackMetric(metricName: string, calculator: () => number) {
    // Простой способ отслеживать метрики
    (this as any)[`_${metricName}`] = calculator;
  }
  
  private getMetric(metricName: string): number {
    const calculator = (this as any)[`_${metricName}`];
    return calculator ? calculator() : 0;
  }
  
  private sendToExternalService(event: AuthTelemetryEvent) {
    // В production здесь будет отправка в Sentry, DataDog, etc.
    if (process.env.NODE_ENV === 'production') {
      // Пример для Sentry
      // Sentry.addBreadcrumb({
      //   category: 'auth',
      //   message: event.event,
      //   data: event
      // });
    }
    
    // Сохранение в localStorage для отладки
    try {
      const stored = JSON.parse(localStorage.getItem('auth_telemetry_events') || '[]');
      stored.push(event);
      if (stored.length > 50) stored.splice(0, stored.length - 50);
      localStorage.setItem('auth_telemetry_events', JSON.stringify(stored));
    } catch (error) {
      // Игнорируем ошибки localStorage
    }
  }
  
  private sendCriticalAlert(alert: any) {
    // Критичные алерты отправляем немедленно
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.sendBeacon) {
      const alertEndpoint = '/api/alerts'; // Ваш endpoint
      navigator.sendBeacon(alertEndpoint, JSON.stringify(alert));
    }
  }
  
  // Публичные методы для получения статистики
  getEventsSummary() {
    const summary: Record<string, number> = {};
    this.events.forEach(event => {
      summary[event.event] = (summary[event.event] || 0) + 1;
    });
    return summary;
  }
  
  getRecentEvents(minutes: number = 5) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.events.filter(e => e.timestamp > cutoff);
  }
  
  exportTelemetryData() {
    return {
      sessionId: this.sessionId,
      events: this.events,
      summary: this.getEventsSummary(),
      metrics: {
        profile_fetch_rate: this.getMetric('profile_fetch_rate'),
        token_refresh_rate: this.getMetric('token_refresh_rate'),
      }
    };
  }
}

// Singleton instance
export const authTelemetry = new AuthTelemetry();

// Готовые хелперы
export const logAuthEvent = (event: string, data?: Record<string, any>) => {
  authTelemetry.log(event, data);
};

export const logProfileFetch = (source: 'cache' | 'network' | 'broadcast', duration?: number, userId?: string) => {
  authTelemetry.log('profile_fetch', { source, dur_ms: duration, userId });
};

export const logIsAdminChange = (isAdmin: boolean | null, userId?: string) => {
  authTelemetry.log('is_admin_change', { isAdmin, userId });
};

export const logRefreshWarning = (count: number) => {
  authTelemetry.log('refresh_loop_warning', { count1min: count });
};

export const logAdminVerifyCall = (path: string, method: string) => {
  authTelemetry.log('admin_verify_call', { path, method });
};