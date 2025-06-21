
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  exponentialBackoff: boolean;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  delayMs: 1000,
  exponentialBackoff: true
};

export const useRetryMechanism = () => {
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    operationName = 'операция'
  ): Promise<T | null> => {
    const { maxRetries, delayMs, exponentialBackoff } = { ...DEFAULT_CONFIG, ...config };
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          setIsRetrying(true);
          const delay = exponentialBackoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const result = await operation();
        setIsRetrying(false);
        
        if (attempt > 0) {
          toast({
            title: "Успешно",
            description: `${operationName} выполнена после ${attempt} попыток`,
          });
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`Attempt ${attempt + 1} failed:`, error);
        
        if (attempt === maxRetries) {
          setIsRetrying(false);
          toast({
            title: "Ошибка",
            description: `Не удалось выполнить ${operationName} после ${maxRetries + 1} попыток`,
            variant: "destructive",
          });
          break;
        }
        
        if (attempt > 0) {
          toast({
            title: "Повторная попытка",
            description: `Попытка ${attempt + 1} не удалась, повторяем...`,
          });
        }
      }
    }
    
    throw lastError;
  }, [toast]);

  return {
    executeWithRetry,
    isRetrying
  };
};
