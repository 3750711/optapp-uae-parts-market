import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

export interface AuthLogData {
  action: 'registration_attempt' | 'registration_success' | 'registration_failure' | 'login_attempt' | 'login_success' | 'login_failure' | 'rate_limit_hit';
  method: 'email' | 'telegram' | 'opt_id';
  userType?: 'seller' | 'buyer';
  error?: string;
  userId?: string;
  metadata?: any;
}

/**
 * Centralized logging for authentication and registration events
 */
export const logAuthEvent = async (data: AuthLogData): Promise<void> => {
  try {
    // Log to console for debugging
    const logLevel = data.action.includes('failure') || data.action === 'rate_limit_hit' ? 'error' : 
                    data.action.includes('attempt') ? 'info' : 'log';
    
    logger[logLevel](`Auth Event: ${data.action}`, {
      method: data.method,
      userType: data.userType,
      hasError: !!data.error,
      userId: data.userId ? '***' : undefined // Mask user ID for privacy
    });

    // Логирование в event_logs отключено - используется Microsoft Clarity
    // login_attempts продолжает работать для безопасности

    // Special handling for failures and rate limits
    if (data.action === 'rate_limit_hit') {
      logger.security('Rate limit exceeded', {
        method: data.method,
        userType: data.userType,
        metadata: data.metadata
      });
    }

    if (data.action.includes('failure') && data.error) {
      logger.security('Authentication failure', {
        method: data.method,
        userType: data.userType,
        errorType: data.error.substring(0, 50) // First 50 chars only
      });
    }

  } catch (error) {
    logger.error('Failed to log auth event', error);
  }
};

/**
 * Log successful registration completion
 */
export const logRegistrationSuccess = async (userType: 'seller' | 'buyer', method: 'email' | 'telegram', userId: string): Promise<void> => {
  await logAuthEvent({
    action: 'registration_success',
    method,
    userType,
    userId
  });
};

/**
 * Log registration failure
 */
export const logRegistrationFailure = async (userType: 'seller' | 'buyer', method: 'email' | 'telegram', error: string): Promise<void> => {
  await logAuthEvent({
    action: 'registration_failure',
    method,
    userType,
    error
  });
};

/**
 * Log login success
 */
export const logLoginSuccess = async (method: 'email' | 'telegram' | 'opt_id', userId: string): Promise<void> => {
  await logAuthEvent({
    action: 'login_success',
    method,
    userId
  });
};

/**
 * Log login failure
 */
export const logLoginFailure = async (method: 'email' | 'telegram' | 'opt_id', error: string): Promise<void> => {
  await logAuthEvent({
    action: 'login_failure',
    method,
    error
  });
};

/**
 * Log rate limit hit
 */
export const logRateLimitHit = async (method: 'email' | 'telegram' | 'opt_id', metadata?: any): Promise<void> => {
  await logAuthEvent({
    action: 'rate_limit_hit',
    method,
    metadata
  });
};