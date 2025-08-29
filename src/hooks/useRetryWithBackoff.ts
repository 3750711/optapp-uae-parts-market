import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  lockErrorPatterns: string[];
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 5,
  baseDelayMs: 500,
  maxDelayMs: 7000,
  lockErrorPatterns: [
    'could not obtain lock',
    'lock timeout', 
    'deadlock',
    'concurrent',
    'transaction deadlock',
    'lock_timeout'
  ]
};

export const useRetryWithBackoff = () => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);

  const isLockError = useCallback((error: Error): boolean => {
    const errorMessage = error.message.toLowerCase();
    return DEFAULT_CONFIG.lockErrorPatterns.some(pattern => 
      errorMessage.includes(pattern)
    );
  }, []);

  const calculateDelay = useCallback((attemptNumber: number): number => {
    // Exponential backoff: 500ms, 1s, 2s, 4s, 7s (capped)
    const delay = Math.min(
      DEFAULT_CONFIG.baseDelayMs * Math.pow(2, attemptNumber),
      DEFAULT_CONFIG.maxDelayMs
    );
    return delay;
  }, []);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string = 'операция'
  ): Promise<T> => {
    setIsRetrying(true);
    setCurrentAttempt(0);
    
    let lastError: Error;

    for (let attempt = 0; attempt < DEFAULT_CONFIG.maxAttempts; attempt++) {
      setCurrentAttempt(attempt + 1);
      
      try {
        console.log(`🔄 Retry attempt ${attempt + 1}/${DEFAULT_CONFIG.maxAttempts} for ${operationName}`);
        
        if (attempt > 0) {
          const delay = calculateDelay(attempt - 1);
          console.log(`⏱️ Waiting ${delay}ms before retry...`);
          
          toast({
            title: "Повтор операции",
            description: `Попытка ${attempt + 1}/${DEFAULT_CONFIG.maxAttempts}. Ожидание ${Math.round(delay / 1000)}с...`,
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const result = await operation();
        
        if (attempt > 0) {
          toast({
            title: "Операция выполнена",
            description: `Успешно выполнено с ${attempt + 1} попытки`,
          });
        }
        
        setIsRetrying(false);
        setCurrentAttempt(0);
        return result;
        
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Attempt ${attempt + 1} failed:`, error.message);
        
        // If it's not a lock error, don't retry
        if (!isLockError(error)) {
          console.log('🚫 Not a lock error, stopping retries');
          break;
        }
        
        // If this was the last attempt, break
        if (attempt === DEFAULT_CONFIG.maxAttempts - 1) {
          console.log('🚫 Max retry attempts reached');
          break;
        }
      }
    }
    
    setIsRetrying(false);
    setCurrentAttempt(0);
    
    // Show final error message
    toast({
      title: "Операция не выполнена",
      description: `Не удалось выполнить после ${DEFAULT_CONFIG.maxAttempts} попыток. Попробуйте позже.`,
      variant: "destructive",
    });
    
    throw lastError!;
  }, [isLockError, calculateDelay]);

  return {
    executeWithRetry,
    isRetrying,
    currentAttempt,
    maxAttempts: DEFAULT_CONFIG.maxAttempts
  };
};