import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Performance monitoring for auth operations
export const useAuthMonitoring = () => {
  const { user, session, isLoading } = useAuth();
  const metricsRef = useRef({
    sessionStartTime: 0,
    authCheckCount: 0,
    lastAuthCheck: 0,
    errorCount: 0,
    slowOperations: 0,
  });

  // Monitor session duration
  useEffect(() => {
    if (session && !metricsRef.current.sessionStartTime) {
      metricsRef.current.sessionStartTime = Date.now();
      console.log('📊 Auth Session Started');
    } else if (!session && metricsRef.current.sessionStartTime) {
      const sessionDuration = Date.now() - metricsRef.current.sessionStartTime;
      console.log(`📊 Auth Session Ended. Duration: ${sessionDuration}ms`);
      metricsRef.current.sessionStartTime = 0;
    }
  }, [session]);

  // Monitor auth checks frequency
  useEffect(() => {
    const now = Date.now();
    metricsRef.current.authCheckCount++;
    metricsRef.current.lastAuthCheck = now;

    // Alert on excessive auth checks
    if (metricsRef.current.authCheckCount > 10) {
      const timeSinceFirstCheck = now - metricsRef.current.sessionStartTime;
      if (timeSinceFirstCheck < 30000) { // 30 seconds
        console.warn('⚠️ Excessive auth checks detected:', metricsRef.current.authCheckCount);
      }
    }
  }, [user, isLoading]);

  // Monitor loading performance
  useEffect(() => {
    if (isLoading) {
      const loadingStartTime = Date.now();
      return () => {
        const loadingDuration = Date.now() - loadingStartTime;
        if (loadingDuration > 5000) { // 5 seconds
          metricsRef.current.slowOperations++;
          console.warn(`⚠️ Slow auth operation detected: ${loadingDuration}ms`);
        }
      };
    }
  }, [isLoading]);

  return {
    getMetrics: () => ({ ...metricsRef.current }),
    resetMetrics: () => {
      metricsRef.current = {
        sessionStartTime: 0,
        authCheckCount: 0,
        lastAuthCheck: 0,
        errorCount: 0,
        slowOperations: 0,
      };
    }
  };
};