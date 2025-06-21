
import { useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60000, // 1 минута
  maxRequests: 10   // 10 запросов в минуту
};

export const useRateLimit = (config: Partial<RateLimitConfig> = {}) => {
  const { toast } = useToast();
  const { windowMs, maxRequests } = { ...DEFAULT_CONFIG, ...config };
  const requestsRef = useRef<number[]>([]);

  const checkRateLimit = useCallback((operationName = 'операция'): boolean => {
    const now = Date.now();
    
    // Удаляем старые запросы
    requestsRef.current = requestsRef.current.filter(
      timestamp => now - timestamp < windowMs
    );
    
    if (requestsRef.current.length >= maxRequests) {
      toast({
        title: "Превышен лимит запросов",
        description: `Слишком много попыток выполнить ${operationName}. Попробуйте позже.`,
        variant: "destructive",
      });
      return false;
    }
    
    requestsRef.current.push(now);
    return true;
  }, [windowMs, maxRequests, toast]);

  const getRemainingRequests = useCallback((): number => {
    const now = Date.now();
    requestsRef.current = requestsRef.current.filter(
      timestamp => now - timestamp < windowMs
    );
    return maxRequests - requestsRef.current.length;
  }, [windowMs, maxRequests]);

  return {
    checkRateLimit,
    getRemainingRequests
  };
};
