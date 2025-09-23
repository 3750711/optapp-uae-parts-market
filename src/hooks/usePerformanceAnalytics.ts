import { useEffect, useRef, useCallback } from 'react';
import { useAuthSession } from '@/contexts/auth/AuthSessionContext';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: Record<string, any>;
}

interface UserInteraction {
  type: 'click' | 'input' | 'scroll' | 'navigation';
  element: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Performance analytics for monitoring user experience
 */
export function usePerformanceAnalytics() {
  const { user } = useAuthSession();
  const metricsRef = useRef<PerformanceMetric[]>([]);
  const interactionsRef = useRef<UserInteraction[]>([]);
  const observerRef = useRef<PerformanceObserver>();

  // Track performance metrics
  const trackMetric = useCallback((name: string, value: number, context?: Record<string, any>) => {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      context,
    };

    metricsRef.current.push(metric);

    // Keep only last 100 metrics
    if (metricsRef.current.length > 100) {
      metricsRef.current.shift();
    }

    // Log critical performance issues
    if (import.meta.env.DEV) {
      if (value > 1000 && name.includes('load')) {
        console.warn(`[Performance] Slow ${name}: ${value.toFixed(2)}ms`);
      }
    }
  }, []);

  // Track user interactions
  const trackInteraction = useCallback((
    type: UserInteraction['type'],
    element: string,
    metadata?: Record<string, any>
  ) => {
    const interaction: UserInteraction = {
      type,
      element,
      timestamp: Date.now(),
      metadata,
    };

    interactionsRef.current.push(interaction);

    // Keep only last 50 interactions
    if (interactionsRef.current.length > 50) {
      interactionsRef.current.shift();
    }
  }, []);

  // Setup performance observer
  useEffect(() => {
    if ('PerformanceObserver' in window && 'performance' in window) {
      // Observe navigation and resource timing
      observerRef.current = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            
            trackMetric('page_load_time', navEntry.loadEventEnd - navEntry.loadEventStart);
            trackMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
            trackMetric('first_contentful_paint', navEntry.loadEventStart - navEntry.fetchStart);
            
          } else if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            // Track slow resources
            if (resourceEntry.duration > 1000) {
              trackMetric('slow_resource', resourceEntry.duration, {
                url: resourceEntry.name,
                type: resourceEntry.initiatorType,
              });
            }
            
          } else if (entry.entryType === 'measure') {
            trackMetric(entry.name, entry.duration);
          }
        });
      });

      try {
        observerRef.current.observe({ 
          entryTypes: ['navigation', 'resource', 'measure'] 
        });
      } catch (e) {
        console.warn('[Performance] Observer setup failed:', e);
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [trackMetric]);

  // Track component mount/unmount times
  const trackComponentPerformance = useCallback((componentName: string) => {
    const startTime = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - startTime;
        trackMetric(`component_render_${componentName}`, duration);
      }
    };
  }, [trackMetric]);

  // Track API call performance
  const trackAPICall = useCallback((endpoint: string, method: string = 'GET') => {
    const startTime = performance.now();
    
    return {
      success: (responseTime?: number) => {
        const duration = responseTime || (performance.now() - startTime);
        trackMetric(`api_${method.toLowerCase()}_success`, duration, { endpoint });
      },
      error: (error: any, responseTime?: number) => {
        const duration = responseTime || (performance.now() - startTime);
        trackMetric(`api_${method.toLowerCase()}_error`, duration, { 
          endpoint, 
          error: error?.message || 'Unknown error' 
        });
      }
    };
  }, [trackMetric]);

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    const metrics = metricsRef.current;
    const interactions = interactionsRef.current;
    
    // Calculate averages for key metrics
    const pageLoadTimes = metrics.filter(m => m.name === 'page_load_time').map(m => m.value);
    const componentRenders = metrics.filter(m => m.name.includes('component_render')).map(m => m.value);
    const apiCalls = metrics.filter(m => m.name.includes('api_')).map(m => m.value);
    
    return {
      avgPageLoadTime: pageLoadTimes.length > 0 ? 
        pageLoadTimes.reduce((a, b) => a + b, 0) / pageLoadTimes.length : 0,
      avgComponentRenderTime: componentRenders.length > 0 ? 
        componentRenders.reduce((a, b) => a + b, 0) / componentRenders.length : 0,
      avgApiCallTime: apiCalls.length > 0 ? 
        apiCalls.reduce((a, b) => a + b, 0) / apiCalls.length : 0,
      totalInteractions: interactions.length,
      metricsCount: metrics.length,
      slowOperations: metrics.filter(m => m.value > 1000).length,
    };
  }, []);

  // Report analytics (would send to analytics service)
  const reportAnalytics = useCallback(async () => {
    if (!user) return;
    
    const summary = getPerformanceSummary();
    const recentInteractions = interactionsRef.current.slice(-10);
    
    // In production, this would send to analytics service
    if (import.meta.env.DEV) {
      console.log('[Performance Analytics]', {
        userId: user.id,
        summary,
        recentInteractions,
        timestamp: new Date().toISOString(),
      });
    }
    
    // TODO: Send to actual analytics service
    // await analyticsService.track('performance_report', { summary, userId: user.id });
  }, [user, getPerformanceSummary]);

  // Auto-report every 5 minutes
  useEffect(() => {
    const interval = setInterval(reportAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [reportAnalytics]);

  return {
    trackMetric,
    trackInteraction,
    trackComponentPerformance,
    trackAPICall,
    getPerformanceSummary,
    reportAnalytics,
  };
}
