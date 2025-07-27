/**
 * Production performance tracking utilities
 */

import { devLog } from './productionOptimizer';

interface PerformanceEntry {
  name: string;
  value: number;
  timestamp: number;
  category: 'navigation' | 'loading' | 'interaction' | 'api' | 'render';
}

class PerformanceTracker {
  private entries: PerformanceEntry[] = [];
  private maxEntries = 100;

  track(name: string, value: number, category: PerformanceEntry['category']) {
    const entry: PerformanceEntry = {
      name,
      value,
      timestamp: Date.now(),
      category
    };

    this.entries.push(entry);
    
    // Keep only recent entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    devLog(`⚡ Performance: ${name}: ${value}ms`);

    // Log slow operations
    if (value > 1000) {
      devLog(`🐌 Slow operation detected: ${name} took ${value}ms`);
    }
  }

  trackPageLoad() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation && navigation.loadEventEnd && navigation.domContentLoadedEventEnd) {
          this.track('page-load', navigation.loadEventEnd - (navigation.fetchStart || 0), 'navigation');
          this.track('dom-ready', navigation.domContentLoadedEventEnd - (navigation.fetchStart || 0), 'loading');
        }
      }, 0);
    }
  }

  measureFunction<T>(name: string, fn: () => T, category: PerformanceEntry['category'] = 'interaction'): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    this.track(name, duration, category);
    return result;
  }

  async measureAsync<T>(
    name: string, 
    fn: () => Promise<T>,
    category: PerformanceEntry['category'] = 'api'
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.track(name, duration, category);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.track(`${name}-error`, duration, category);
      throw error;
    }
  }

  getMetrics() {
    return [...this.entries];
  }

  getAverageByCategory(category: PerformanceEntry['category']) {
    const categoryEntries = this.entries.filter(entry => entry.category === category);
    if (categoryEntries.length === 0) return 0;
    
    const sum = categoryEntries.reduce((acc, entry) => acc + entry.value, 0);
    return sum / categoryEntries.length;
  }

  getSlowestOperations(limit = 10) {
    return [...this.entries]
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }
}

export const performanceTracker = new PerformanceTracker();

// Auto-track page load on initialization
if (typeof window !== 'undefined') {
  performanceTracker.trackPageLoad();
}
