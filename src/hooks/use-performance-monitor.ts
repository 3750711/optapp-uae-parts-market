import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  realTimeLatency: number[];
  optimisticUpdateSuccess: number;
  optimisticUpdateFailure: number;
  batchQueryTime: number[];
  uiResponseTime: number[];
  errorRate: number;
  totalOffers: number;
  averageDebounceTime: number;
}

interface PerformanceEvent {
  type: 'realtime_update' | 'optimistic_success' | 'optimistic_failure' | 'batch_query' | 'ui_response' | 'error';
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export class PriceOffersPerformanceMonitor {
  private static instance: PriceOffersPerformanceMonitor;
  private metrics: PerformanceMetrics;
  private events: PerformanceEvent[] = [];
  private subscribers: Array<(metrics: PerformanceMetrics) => void> = [];
  private debounceStartTime: number = 0;

  private constructor() {
    this.metrics = {
      realTimeLatency: [],
      optimisticUpdateSuccess: 0,
      optimisticUpdateFailure: 0,
      batchQueryTime: [],
      uiResponseTime: [],
      errorRate: 0,
      totalOffers: 0,
      averageDebounceTime: 0
    };
  }

  static getInstance(): PriceOffersPerformanceMonitor {
    if (!PriceOffersPerformanceMonitor.instance) {
      PriceOffersPerformanceMonitor.instance = new PriceOffersPerformanceMonitor();
    }
    return PriceOffersPerformanceMonitor.instance;
  }

  // Start measuring debounce time
  startDebounce(): void {
    this.debounceStartTime = performance.now();
  }

  // End measuring debounce time
  endDebounce(): void {
    if (this.debounceStartTime > 0) {
      const debounceTime = performance.now() - this.debounceStartTime;
      this.recordEvent({
        type: 'realtime_update',
        timestamp: Date.now(),
        duration: debounceTime
      });
      this.debounceStartTime = 0;
    }
  }

  // Record real-time update latency
  recordRealTimeUpdate(latency: number): void {
    this.metrics.realTimeLatency.push(latency);
    if (this.metrics.realTimeLatency.length > 100) {
      this.metrics.realTimeLatency.shift(); // Keep only last 100 measurements
    }
    this.notifySubscribers();
  }

  // Record optimistic update success
  recordOptimisticSuccess(): void {
    this.metrics.optimisticUpdateSuccess++;
    this.recordEvent({
      type: 'optimistic_success',
      timestamp: Date.now()
    });
    this.notifySubscribers();
  }

  // Record optimistic update failure
  recordOptimisticFailure(error?: string): void {
    this.metrics.optimisticUpdateFailure++;
    this.recordEvent({
      type: 'optimistic_failure',
      timestamp: Date.now(),
      metadata: { error }
    });
    this.updateErrorRate();
    this.notifySubscribers();
  }

  // Record batch query performance
  recordBatchQuery(duration: number, productCount: number): void {
    this.metrics.batchQueryTime.push(duration);
    if (this.metrics.batchQueryTime.length > 50) {
      this.metrics.batchQueryTime.shift();
    }
    this.recordEvent({
      type: 'batch_query',
      timestamp: Date.now(),
      duration,
      metadata: { productCount }
    });
    this.notifySubscribers();
  }

  // Record UI response time
  recordUIResponse(duration: number): void {
    this.metrics.uiResponseTime.push(duration);
    if (this.metrics.uiResponseTime.length > 100) {
      this.metrics.uiResponseTime.shift();
    }
    this.recordEvent({
      type: 'ui_response',
      timestamp: Date.now(),
      duration
    });
    this.notifySubscribers();
  }

  // Record general error
  recordError(error: string, context?: string): void {
    this.recordEvent({
      type: 'error',
      timestamp: Date.now(),
      metadata: { error, context }
    });
    this.updateErrorRate();
    this.notifySubscribers();
  }

  // Update total offers count
  updateTotalOffers(count: number): void {
    this.metrics.totalOffers = count;
    this.notifySubscribers();
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics & {
    averageRealTimeLatency: number;
    averageBatchQueryTime: number;
    averageUIResponseTime: number;
    successRate: number;
  } {
    const avgRealTimeLatency = this.metrics.realTimeLatency.length > 0 
      ? this.metrics.realTimeLatency.reduce((a, b) => a + b, 0) / this.metrics.realTimeLatency.length 
      : 0;

    const avgBatchQueryTime = this.metrics.batchQueryTime.length > 0 
      ? this.metrics.batchQueryTime.reduce((a, b) => a + b, 0) / this.metrics.batchQueryTime.length 
      : 0;

    const avgUIResponseTime = this.metrics.uiResponseTime.length > 0 
      ? this.metrics.uiResponseTime.reduce((a, b) => a + b, 0) / this.metrics.uiResponseTime.length 
      : 0;

    const totalOptimisticAttempts = this.metrics.optimisticUpdateSuccess + this.metrics.optimisticUpdateFailure;
    const successRate = totalOptimisticAttempts > 0 
      ? (this.metrics.optimisticUpdateSuccess / totalOptimisticAttempts) * 100 
      : 100;

    return {
      ...this.metrics,
      averageRealTimeLatency: avgRealTimeLatency,
      averageBatchQueryTime: avgBatchQueryTime,
      averageUIResponseTime: avgUIResponseTime,
      successRate: successRate
    };
  }

  // Get events for analysis
  getEvents(limit: number = 100): PerformanceEvent[] {
    return this.events.slice(-limit);
  }

  // Subscribe to metrics updates
  subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Export metrics for analysis
  exportMetrics(): string {
    const fullMetrics = this.getMetrics();
    const exportData = {
      timestamp: new Date().toISOString(),
      metrics: fullMetrics,
      events: this.getEvents(500),
      summary: {
        avgLatency: fullMetrics.averageRealTimeLatency,
        avgBatchTime: fullMetrics.averageBatchQueryTime,
        avgUITime: fullMetrics.averageUIResponseTime,
        successRate: fullMetrics.successRate,
        errorRate: fullMetrics.errorRate,
        totalOffers: fullMetrics.totalOffers
      }
    };
    return JSON.stringify(exportData, null, 2);
  }

  // Reset metrics (for testing)
  reset(): void {
    this.metrics = {
      realTimeLatency: [],
      optimisticUpdateSuccess: 0,
      optimisticUpdateFailure: 0,
      batchQueryTime: [],
      uiResponseTime: [],
      errorRate: 0,
      totalOffers: 0,
      averageDebounceTime: 0
    };
    this.events = [];
    this.notifySubscribers();
  }

  private recordEvent(event: PerformanceEvent): void {
    this.events.push(event);
    if (this.events.length > 1000) {
      this.events.shift(); // Keep only last 1000 events
    }
  }

  private updateErrorRate(): void {
    const recentEvents = this.events.slice(-100); // Last 100 events
    const errors = recentEvents.filter(e => e.type === 'error' || e.type === 'optimistic_failure').length;
    this.metrics.errorRate = recentEvents.length > 0 ? (errors / recentEvents.length) * 100 : 0;
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.metrics));
  }
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(
    PriceOffersPerformanceMonitor.getInstance().getMetrics()
  );

  useEffect(() => {
    const monitor = PriceOffersPerformanceMonitor.getInstance();
    const unsubscribe = monitor.subscribe(setMetrics);
    return unsubscribe;
  }, []);

  const monitor = PriceOffersPerformanceMonitor.getInstance();

  return {
    metrics: monitor.getMetrics(),
    recordRealTimeUpdate: monitor.recordRealTimeUpdate.bind(monitor),
    recordOptimisticSuccess: monitor.recordOptimisticSuccess.bind(monitor),
    recordOptimisticFailure: monitor.recordOptimisticFailure.bind(monitor),
    recordBatchQuery: monitor.recordBatchQuery.bind(monitor),
    recordUIResponse: monitor.recordUIResponse.bind(monitor),
    recordError: monitor.recordError.bind(monitor),
    updateTotalOffers: monitor.updateTotalOffers.bind(monitor),
    exportMetrics: monitor.exportMetrics.bind(monitor),
    reset: monitor.reset.bind(monitor),
    startDebounce: monitor.startDebounce.bind(monitor),
    endDebounce: monitor.endDebounce.bind(monitor)
  };
};