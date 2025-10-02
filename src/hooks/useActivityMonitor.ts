import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getActivityMetrics } from '@/utils/activityLogger';
import { logger } from '@/utils/logger';

interface ActivityHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'loading' | 'error';
  checks?: {
    database: { status: string; latency?: number };
    eventLogs: { status: string; recentEvents?: number };
    performance: { status: string; errorRate?: number };
  };
  metrics?: {
    totalEvents: number;
    eventsLast24h: number;
    eventsLastHour: number;
    uniqueUsers24h: number;
    errorCount24h: number;
  };
  clientMetrics?: {
    totalEvents: number;
    successfulBatches: number;
    failedBatches: number;
    averageBatchSize: number;
    averageFlushTime: number;
    queueSize: number;
    rateLimitHits: number;
  };
  lastChecked?: string;
  error?: string;
}

/**
 * Hook for monitoring activity logging health and performance
 * Useful for admin dashboards and debugging
 */
export const useActivityMonitor = (options: { 
  autoRefresh?: boolean; 
  refreshInterval?: number;
  includeClientMetrics?: boolean;
} = {}) => {
  const { 
    autoRefresh = false, 
    refreshInterval = 30000,
    includeClientMetrics = true 
  } = options;

  const [healthCheck, setHealthCheck] = useState<ActivityHealthCheck>({
    status: 'loading'
  });

  const checkHealth = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('monitor-activity');

      if (error) {
        logger.error('Failed to fetch activity health check', { error: error.message });
        setHealthCheck({
          status: 'error',
          error: error.message,
          lastChecked: new Date().toISOString()
        });
        return;
      }

      const clientMetrics = includeClientMetrics ? getActivityMetrics() : undefined;

      setHealthCheck({
        status: data.status,
        checks: data.checks,
        metrics: data.metrics,
        clientMetrics: clientMetrics ? {
          totalEvents: clientMetrics.totalEvents,
          successfulBatches: clientMetrics.successfulBatches,
          failedBatches: clientMetrics.failedBatches,
          averageBatchSize: clientMetrics.averageBatchSize,
          averageFlushTime: clientMetrics.averageFlushTime,
          queueSize: clientMetrics.queueSize,
          rateLimitHits: clientMetrics.rateLimitHits
        } : undefined,
        lastChecked: new Date().toISOString()
      });

      logger.log('Activity health check completed', { status: data.status });
    } catch (err) {
      logger.error('Error checking activity health', { 
        error: err instanceof Error ? err.message : 'Unknown error' 
      });
      setHealthCheck({
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
        lastChecked: new Date().toISOString()
      });
    }
  };

  useEffect(() => {
    // Initial check
    checkHealth();

    // Set up auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(checkHealth, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return {
    healthCheck,
    refreshHealth: checkHealth,
    isHealthy: healthCheck.status === 'healthy',
    isDegraded: healthCheck.status === 'degraded',
    isUnhealthy: healthCheck.status === 'unhealthy',
    isLoading: healthCheck.status === 'loading',
    hasError: healthCheck.status === 'error'
  };
};
