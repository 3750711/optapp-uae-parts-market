import { useEffect, useRef } from 'react';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

export const usePerformanceMonitor = () => {
  const metricsRef = useRef<PerformanceMetric[]>([]);

  const startTimer = (name: string) => {
    const startTime = performance.now();
    return {
      end: () => {
        const duration = performance.now() - startTime;
        const metric: PerformanceMetric = {
          name,
          duration,
          timestamp: Date.now(),
        };
        
        metricsRef.current.push(metric);
        
        // Only in development, log slow operations
        if (import.meta.env.DEV && duration > 100) {
          console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
        }
        
        return metric;
      }
    };
  };

  const getMetrics = () => metricsRef.current;

  const clearMetrics = () => {
    metricsRef.current = [];
  };

  // Web Vitals monitoring
  useEffect(() => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            metricsRef.current.push({
              name: 'page-load',
              duration: navEntry.loadEventEnd - navEntry.loadEventStart,
              timestamp: Date.now(),
            });
          }
        });
      });

      observer.observe({ type: 'navigation', buffered: true });

      return () => observer.disconnect();
    }
  }, []);

  return {
    startTimer,
    getMetrics,
    clearMetrics,
  };
};