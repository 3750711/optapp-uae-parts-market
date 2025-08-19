
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface RateLimitConfig {
  limitPerHour?: number;
  windowMinutes?: number;
}

interface RateLimitResponse {
  allowed: boolean;
  remainingRequests: number;
  resetTime: string;
  message?: string;
}

export const useRateLimit = () => {
  const { toast } = useToast();

  const checkRateLimit = useCallback(async (
    action: string, 
    config: RateLimitConfig = {}
  ): Promise<boolean> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('Rate limit check attempted without authenticated user');
        return false;
      }

      // Call rate limiter edge function
      const { data, error } = await supabase.functions.invoke('rate-limiter', {
        body: {
          userId: user.id,
          action,
          limitPerHour: config.limitPerHour || 60,
          windowMinutes: config.windowMinutes || 60,
        }
      });

      if (error) {
        logger.error('Rate limit check failed', error);
        // Allow action on rate limiter failure to avoid blocking users
        return true;
      }

      const response = data as RateLimitResponse;

      if (!response.allowed) {
        logger.security('Rate limit exceeded', {
          action,
          userId: user.id,
          remainingRequests: response.remainingRequests,
        });

        toast({
          title: "Rate Limit Exceeded",
          description: response.message || "Too many requests. Please try again later.",
          variant: "destructive",
        });

        return false;
      }

      // Log successful rate limit check in development
      if (import.meta.env.DEV) {
        logger.debug('Rate limit check passed', {
          action,
          remainingRequests: response.remainingRequests,
        });
      }

      return true;

    } catch (error) {
      logger.error('Rate limit check exception', error);
      // Allow action on exception to avoid blocking users
      return true;
    }
  }, [toast]);

  const getRemainingRequests = useCallback(async (
    action: string,
    config: RateLimitConfig = {}
  ): Promise<number> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase.functions.invoke('rate-limiter', {
        body: {
          userId: user.id,
          action,
          limitPerHour: config.limitPerHour || 60,
          windowMinutes: config.windowMinutes || 60,
        }
      });

      if (error || !data) {
        return config.limitPerHour || 60; // Return full limit on error
      }

      const response = data as RateLimitResponse;
      return response.remainingRequests;

    } catch (error) {
      logger.error('Get remaining requests failed', error);
      return config.limitPerHour || 60;
    }
  }, []);

  return {
    checkRateLimit,
    getRemainingRequests,
  };
};
