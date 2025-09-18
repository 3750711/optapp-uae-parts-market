import { useState, useCallback } from 'react';
import { ProgressStep } from '@/components/admin/ProductCreationProgress';

export interface MonitoringConfig {
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

const DEFAULT_CONFIG: MonitoringConfig = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

export const useProductCreationMonitoring = (config: Partial<MonitoringConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [totalProgress, setTotalProgress] = useState(0);

  const initializeSteps = useCallback((stepDefinitions: Array<{ id: string; label: string }>) => {
    setSteps(stepDefinitions.map(def => ({
      ...def,
      status: 'pending' as const
    })));
    setTotalProgress(0);
  }, []);

  const updateStep = useCallback((stepId: string, updates: Partial<ProgressStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
    
    // Calculate total progress
    setSteps(prev => {
      const completedSteps = prev.filter(s => s.status === 'completed').length;
      const errorSteps = prev.filter(s => s.status === 'error').length;
      const totalSteps = prev.length;
      const progress = ((completedSteps + errorSteps) / totalSteps) * 100;
      setTotalProgress(progress);
      return prev;
    });
  }, []);

  const startStep = useCallback((stepId: string) => {
    const startTime = performance.now();
    updateStep(stepId, { status: 'in-progress' });
    return startTime;
  }, [updateStep]);

  const completeStep = useCallback((stepId: string, startTime: number, error?: string) => {
    const duration = performance.now() - startTime;
    updateStep(stepId, {
      status: error ? 'error' : 'completed',
      duration,
      error
    });
    
    console.log(`Step ${stepId} ${error ? 'failed' : 'completed'} in ${duration.toFixed(2)}ms`, error ? { error } : {});
  }, [updateStep]);

  const withTimeout = useCallback(async <T>(
    promise: Promise<T>,
    stepId: string,
    timeout = finalConfig.timeout
  ): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Step ${stepId} timed out after ${timeout}ms`)), timeout)
      )
    ]);
  }, [finalConfig.timeout]);

  const withRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    stepId: string,
    maxAttempts = finalConfig.retryAttempts
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Step ${stepId} attempt ${attempt}/${maxAttempts} failed:`, lastError.message);
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay * attempt));
        }
      }
    }
    
    throw lastError!;
  }, [finalConfig.retryAttempts, finalConfig.retryDelay]);

  const executeStep = useCallback(async <T>(
    stepId: string,
    operation: () => Promise<T>,
    options: { timeout?: number; retryAttempts?: number } = {}
  ): Promise<T> => {
    const startTime = startStep(stepId);
    
    try {
      const result = await withTimeout(
        withRetry(operation, stepId, options.retryAttempts),
        stepId,
        options.timeout
      );
      
      completeStep(stepId, startTime);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      completeStep(stepId, startTime, errorMessage);
      throw error;
    }
  }, [startStep, completeStep, withTimeout, withRetry]);

  const reset = useCallback(() => {
    setSteps([]);
    setTotalProgress(0);
  }, []);

  return {
    steps,
    totalProgress,
    initializeSteps,
    updateStep,
    executeStep,
    reset
  };
};