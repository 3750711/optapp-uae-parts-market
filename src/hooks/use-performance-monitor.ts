import { useCallback, useRef } from 'react';

interface PerformanceMetrics {
  realTimeUpdates: number[];
  debounceOperations: number[];
  queryExecutions: number[];
}

const performanceStore: PerformanceMetrics = {
  realTimeUpdates: [],
  debounceOperations: [],
  queryExecutions: []
};

export const usePerformanceMonitor = () => {
  const debounceStartRef = useRef<number>(0);

  const recordRealTimeUpdate = useCallback((duration: number) => {
    performanceStore.realTimeUpdates.push(duration);
    
    // Keep only last 100 measurements
    if (performanceStore.realTimeUpdates.length > 100) {
      performanceStore.realTimeUpdates.shift();
    }
    
    // Log slow operations
    if (duration > 100) {
      console.warn(`⚠️ Slow Real-time update: ${duration.toFixed(2)}ms`);
    }
  }, []);

  const startDebounce = useCallback(() => {
    debounceStartRef.current = performance.now();
  }, []);

  const endDebounce = useCallback(() => {
    if (debounceStartRef.current > 0) {
      const duration = performance.now() - debounceStartRef.current;
      performanceStore.debounceOperations.push(duration);
      
      // Keep only last 50 measurements
      if (performanceStore.debounceOperations.length > 50) {
        performanceStore.debounceOperations.shift();
      }
      
      debounceStartRef.current = 0;
    }
  }, []);

  const recordQueryExecution = useCallback((duration: number) => {
    performanceStore.queryExecutions.push(duration);
    
    // Keep only last 50 measurements
    if (performanceStore.queryExecutions.length > 50) {
      performanceStore.queryExecutions.shift();
    }
    
    // Log slow queries
    if (duration > 500) {
      console.warn(`⚠️ Slow query execution: ${duration.toFixed(2)}ms`);
    }
  }, []);

  const getMetrics = useCallback(() => {
    const calculateAverage = (arr: number[]) => 
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return {
      realTimeUpdates: {
        count: performanceStore.realTimeUpdates.length,
        average: calculateAverage(performanceStore.realTimeUpdates),
        max: Math.max(...performanceStore.realTimeUpdates, 0)
      },
      debounceOperations: {
        count: performanceStore.debounceOperations.length,
        average: calculateAverage(performanceStore.debounceOperations),
        max: Math.max(...performanceStore.debounceOperations, 0)
      },
      queryExecutions: {
        count: performanceStore.queryExecutions.length,
        average: calculateAverage(performanceStore.queryExecutions),
        max: Math.max(...performanceStore.queryExecutions, 0)
      }
    };
  }, []);

  const recordOptimisticSuccess = useCallback((duration: number) => {
    performanceStore.realTimeUpdates.push(duration);
    if (performanceStore.realTimeUpdates.length > 100) {
      performanceStore.realTimeUpdates.shift();
    }
  }, []);

  const recordOptimisticFailure = useCallback((duration: number) => {
    performanceStore.realTimeUpdates.push(duration);
    if (performanceStore.realTimeUpdates.length > 100) {
      performanceStore.realTimeUpdates.shift();
    }
  }, []);

  const recordUIResponse = useCallback((duration: number) => {
    recordRealTimeUpdate(duration);
  }, [recordRealTimeUpdate]);

  const reset = useCallback(() => {
    performanceStore.realTimeUpdates.length = 0;
    performanceStore.debounceOperations.length = 0;
    performanceStore.queryExecutions.length = 0;
  }, []);

  const exportMetrics = useCallback(() => {
    const metrics = getMetrics();
    const data = {
      timestamp: new Date().toISOString(),
      metrics,
      summary: {
        totalOperations: metrics.realTimeUpdates.count + metrics.debounceOperations.count + metrics.queryExecutions.count,
        averageResponseTime: (metrics.realTimeUpdates.average + metrics.debounceOperations.average + metrics.queryExecutions.average) / 3
      }
    };
    return data;
  }, [getMetrics]);

  const metrics = getMetrics();

  return {
    recordRealTimeUpdate,
    startDebounce,
    endDebounce,
    recordQueryExecution,
    recordOptimisticSuccess,
    recordOptimisticFailure,
    recordUIResponse,
    getMetrics,
    reset,
    exportMetrics,
    metrics
  };
};
