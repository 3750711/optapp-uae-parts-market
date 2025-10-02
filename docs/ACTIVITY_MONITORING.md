# Activity Monitoring System

## Overview

Фаза 4 реализует полную систему мониторинга для activity logging с метриками производительности, health checks и инструментами для отладки.

## Компоненты

### 1. Client-Side Metrics (`activityLogger.ts`)

**Метрики производительности:**
- `totalEvents`: Общее количество событий
- `successfulBatches`: Успешно отправленные батчи
- `failedBatches`: Неудачные батчи
- `averageBatchSize`: Средний размер батча
- `averageFlushTime`: Среднее время отправки (мс)
- `queueSize`: Текущий размер очереди
- `rateLimitHits`: Количество срабатываний rate limit
- `errors`: Последние 10 ошибок

**API:**
```typescript
import { getActivityMetrics, resetActivityMetrics } from '@/utils/activityLogger';

// Получить метрики
const metrics = getActivityMetrics();
console.log('Queue size:', metrics.queueSize);
console.log('Success rate:', 
  metrics.successfulBatches / (metrics.successfulBatches + metrics.failedBatches)
);

// Сбросить метрики
resetActivityMetrics();
```

### 2. Health Check Edge Function (`monitor-activity`)

**Endpoint:** `GET /functions/v1/monitor-activity`

**Response:**
```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "checks": {
    "database": {
      "status": "ok",
      "latency": 45
    },
    "eventLogs": {
      "status": "ok",
      "recentEvents": 1234,
      "oldestEvent": "2025-09-15T10:00:00Z"
    },
    "performance": {
      "status": "ok",
      "errorRate": 2.3
    }
  },
  "metrics": {
    "totalEvents": 50000,
    "eventsLast24h": 5000,
    "eventsLastHour": 200,
    "uniqueUsers24h": 150,
    "errorCount24h": 115,
    "topEventTypes": [
      { "event_type": "page_view", "count": 3000 },
      { "event_type": "button_click", "count": 1500 }
    ]
  },
  "timestamp": "2025-10-02T12:00:00Z"
}
```

**Health Status:**
- `healthy`: Все системы работают нормально
- `degraded`: Есть предупреждения (например, elevated error rate)
- `unhealthy`: Критические ошибки (БД недоступна, высокий error rate >10%)

### 3. Edge Function Metrics (`log-activity`)

**Автоматические метрики в логах:**
```
✅ Successfully inserted 50 events in 234ms
📊 Metrics: {
  totalRequests: 1234,
  successRate: "98.5%",
  avgProcessingTime: "187ms",
  totalEventsProcessed: 61700
}
```

### 4. React Hook (`useActivityMonitor`)

**Использование:**
```tsx
import { useActivityMonitor } from '@/hooks/useActivityMonitor';

function ActivityDashboard() {
  const { 
    healthCheck, 
    refreshHealth, 
    isHealthy,
    isDegraded,
    isUnhealthy 
  } = useActivityMonitor({
    autoRefresh: true,
    refreshInterval: 30000, // 30 секунд
    includeClientMetrics: true
  });

  if (healthCheck.status === 'loading') {
    return <div>Loading health status...</div>;
  }

  return (
    <div>
      <h2>Activity Logging Health</h2>
      <p>Status: {healthCheck.status}</p>
      
      {isHealthy && <span className="text-success">✓ All systems operational</span>}
      {isDegraded && <span className="text-warning">⚠ Degraded performance</span>}
      {isUnhealthy && <span className="text-error">✗ System issues detected</span>}
      
      <div>
        <h3>Database</h3>
        <p>Latency: {healthCheck.checks?.database.latency}ms</p>
        
        <h3>Metrics (Last 24h)</h3>
        <p>Events: {healthCheck.metrics?.eventsLast24h}</p>
        <p>Errors: {healthCheck.metrics?.errorCount24h}</p>
        <p>Unique Users: {healthCheck.metrics?.uniqueUsers24h}</p>
        
        <h3>Client Metrics</h3>
        <p>Queue Size: {healthCheck.clientMetrics?.queueSize}</p>
        <p>Avg Batch Size: {healthCheck.clientMetrics?.averageBatchSize}</p>
        <p>Success Rate: {
          (healthCheck.clientMetrics?.successfulBatches || 0) / 
          ((healthCheck.clientMetrics?.successfulBatches || 0) + 
           (healthCheck.clientMetrics?.failedBatches || 0)) * 100
        }%</p>
      </div>
      
      <button onClick={refreshHealth}>Refresh</button>
    </div>
  );
}
```

## Алерты и Предупреждения

### Автоматические проверки:

1. **Database Latency** - предупреждение если > 1000ms
2. **Error Rate** - warning если > 5%, error если > 10%
3. **Recent Events** - предупреждение если нет событий за последний час
4. **Rate Limit Hits** - логируются в метриках

### Логирование:

**Клиент:**
- Rate limit превышен: `logger.warn('Rate limit exceeded...')`
- Ошибки отправки: `logger.warn('Failed to send event batch...')`
- Успешные батчи: `logger.log('✅ Batch flushed: 50 events in 234ms')`

**Edge Function:**
- Каждый запрос: `📥 Processing activity logging request`
- Успех: `✅ Successfully inserted 50 events in 234ms`
- Метрики: `📊 Metrics: { totalRequests: 1234, ... }`
- Rate limit: `⚠️ Rate limit exceeded for user:123`

## Рекомендации по использованию

### Для разработки:
1. Включить `useActivityMonitor` в dev tools
2. Отслеживать метрики в консоли
3. Проверять health check при проблемах с логированием

### Для продакшена:
1. Настроить мониторинг через `/monitor-activity` endpoint
2. Интегрировать с external monitoring (Grafana, DataDog, etc.)
3. Настроить alerts на `status: 'unhealthy'`
4. Регулярно проверять error rate

### Для отладки:
```typescript
// Получить текущие метрики
const metrics = getActivityMetrics();
console.table(metrics);

// Проверить здоровье системы
const { data } = await supabase.functions.invoke('monitor-activity');
console.log('Health:', data.status);
console.log('Error rate:', data.checks.performance.errorRate);
```

## Performance Benchmarks

**Целевые показатели:**
- Client batch flush: < 500ms
- Edge function processing: < 300ms
- Database latency: < 100ms
- Error rate: < 5%
- Success rate: > 95%

**При деградации:**
- Проверить размер батчей
- Проверить индексы БД
- Проверить rate limits
- Увеличить flush interval

## Завершенные фазы

✅ **Фаза 1**: Database Foundation - индексы, system_metadata  
✅ **Фаза 2**: Rate Limiting - клиент + сервер  
✅ **Фаза 3**: Optimization - batching, debouncing  
✅ **Фаза 4**: Monitoring - метрики, health checks

## Итого

Система мониторинга обеспечивает:
- Real-time метрики производительности
- Health checks для проактивного обнаружения проблем
- Детальное логирование для отладки
- React hook для UI интеграции
- Production-ready monitoring endpoint
