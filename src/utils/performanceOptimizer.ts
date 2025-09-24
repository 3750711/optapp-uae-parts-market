import { usePerformanceMonitor } from '@/hooks/use-performance-monitor';

// Performance optimization utilities
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private rafId: number | null = null;
  private updateQueue: Array<() => void> = [];
  private metrics = {
    renders: 0,
    batchedUpdates: 0,
    savedRenders: 0
  };

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Batch DOM updates to prevent excessive re-renders
  batchUpdate(updateFn: () => void): void {
    this.updateQueue.push(updateFn);
    
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.flushUpdates();
      });
    }
  }

  private flushUpdates(): void {
    const updates = [...this.updateQueue];
    this.updateQueue = [];
    this.rafId = null;
    
    // Execute all batched updates
    updates.forEach(update => update());
    
    this.metrics.batchedUpdates++;
    this.metrics.savedRenders += Math.max(0, updates.length - 1);
    
    if (import.meta.env.DEV) {
      console.log('Performance: Batched', updates.length, 'updates, saved', updates.length - 1, 'renders');
    }
  }

  // Debounce function calls
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Throttle function calls
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Virtual scrolling helper
  calculateVisibleRange(
    scrollTop: number,
    containerHeight: number,
    itemHeight: number,
    totalItems: number,
    overscan = 5
  ): { start: number; end: number } {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(totalItems, start + visibleCount + overscan * 2);
    
    return { start, end };
  }

  // Get performance metrics
  getMetrics() {
    return { ...this.metrics };
  }

  // Reset metrics
  resetMetrics() {
    this.metrics = {
      renders: 0,
      batchedUpdates: 0,
      savedRenders: 0
    };
  }
}

// Hook for performance optimization
export const usePerformanceOptimization = () => {
  const optimizer = PerformanceOptimizer.getInstance();
  const performanceMonitor = usePerformanceMonitor();

  return {
    batchUpdate: optimizer.batchUpdate.bind(optimizer),
    debounce: optimizer.debounce.bind(optimizer),
    throttle: optimizer.throttle.bind(optimizer),
    calculateVisibleRange: optimizer.calculateVisibleRange.bind(optimizer),
    getMetrics: optimizer.getMetrics.bind(optimizer),
    resetMetrics: optimizer.resetMetrics.bind(optimizer),
    monitor: performanceMonitor
  };
};