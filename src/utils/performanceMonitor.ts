interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observer: PerformanceObserver | null = null;

  constructor() {
    this.initializeObserver();
    this.monitorCoreWebVitals();
  }

  private initializeObserver() {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name, entry.startTime);
        }
      });

      // Monitor paint timing
      this.observer.observe({ entryTypes: ['paint'] });
      
      // Monitor navigation timing
      this.observer.observe({ entryTypes: ['navigation'] });
      
      // Monitor resource timing
      this.observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }
  }

  private monitorCoreWebVitals() {
    // Monitor Largest Contentful Paint (LCP)
    this.measureLCP();
    
    // Monitor First Input Delay (FID)
    this.measureFID();
    
    // Monitor Cumulative Layout Shift (CLS)
    this.measureCLS();
  }

  private measureLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('LCP', lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('LCP monitoring failed:', error);
    }
  }

  private measureFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-input') {
            this.recordMetric('FID', (entry as any).processingStart - entry.startTime);
          }
        }
      });
      observer.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('FID monitoring failed:', error);
    }
  }

  private measureCLS() {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            this.recordMetric('CLS', clsValue);
          }
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('CLS monitoring failed:', error);
    }
  }

  private recordMetric(name: string, value: number) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now()
    };

    this.metrics.push(metric);

    // Log critical metrics in development
    if (import.meta.env.DEV) {
      console.log(`📊 ${name}: ${value.toFixed(2)}ms`);
    }

    // Keep only recent metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-50);
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  public getLatestMetric(name: string): PerformanceMetric | null {
    const metrics = this.getMetricsByName(name);
    return metrics.length > 0 ? metrics[metrics.length - 1] : null;
  }

  public destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.metrics = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for manual measurements
export const measureTime = (label: string) => {
  const start = performance.now();
  return {
    end: () => {
      const duration = performance.now() - start;
      performanceMonitor['recordMetric'](label, duration);
      return duration;
    }
  };
};

export const measureAsyncOperation = async <T>(
  label: string,
  operation: () => Promise<T>
): Promise<T> => {
  const measurement = measureTime(label);
  try {
    const result = await operation();
    measurement.end();
    return result;
  } catch (error) {
    measurement.end();
    throw error;
  }
};
