import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityEvent {
  event_type: 'login' | 'logout' | 'page_view' | 'button_click' | 'api_error' | 'client_error';
  event_subtype?: string;
  path?: string;
  metadata?: Record<string, any>;
  user_id?: string | null;
}

/**
 * Centralized logging for user activity events
 * Extends existing authLogger functionality to general user activity
 */
export const logActivity = async (event: ActivityEvent): Promise<void> => {
  try {
    // Don't block UI for logging errors - log and continue
    const currentUser = (await supabase.auth.getUser()).data.user;
    const userId = event.user_id || currentUser?.id || null;

    // Get browser info for context
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : undefined;
    const currentPath = event.path || (typeof window !== 'undefined' ? window.location.pathname : undefined);

    // Log to console for debugging
    const logLevel = event.event_type.includes('error') ? 'error' : 'info';
    
    logger[logLevel](`Activity Event: ${event.event_type}`, {
      event_subtype: event.event_subtype,
      path: currentPath,
      hasMetadata: !!event.metadata,
      userId: userId ? '***' : undefined // Mask user ID for privacy
    });

    // Use the existing event_logs table (now extended with our new fields)
    const { error } = await supabase.from('event_logs').insert({
      action_type: event.event_type,
      entity_type: 'user_activity',
      entity_id: userId,
      user_id: userId,
      event_subtype: event.event_subtype,
      path: currentPath,
      user_agent: userAgent,
      details: {
        metadata: event.metadata,
        timestamp: new Date().toISOString()
      }
    });

    if (error) {
      logger.warn('Failed to log activity event to database', {
        event_type: event.event_type,
        error: error.message
      });
    }

    // Special handling for errors
    if (event.event_type === 'client_error' && event.metadata) {
      logger.security('Client error reported', {
        event_subtype: event.event_subtype,
        path: currentPath,
        errorInfo: typeof event.metadata.message === 'string' ? 
          event.metadata.message.substring(0, 100) : 'unknown_error'
      });
    }

  } catch (error) {
    // Never throw errors from logging - just log and continue
    logger.error('Failed to log activity event', {
      event_type: event.event_type,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Log user login
 */
export const logUserLogin = async (method: string = 'email', userId?: string): Promise<void> => {
  await logActivity({
    event_type: 'login',
    event_subtype: method,
    user_id: userId,
    metadata: {
      timestamp: new Date().toISOString(),
      method
    }
  });
};

/**
 * Log user logout
 */
export const logUserLogout = async (userId?: string): Promise<void> => {
  await logActivity({
    event_type: 'logout',
    user_id: userId,
    metadata: {
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Log page view
 */
export const logPageView = async (path: string, metadata?: Record<string, any>): Promise<void> => {
  await logActivity({
    event_type: 'page_view',
    path,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  });
};

/**
 * Log client-side error
 */
export const logClientError = async (error: Error | string, context?: Record<string, any>): Promise<void> => {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  await logActivity({
    event_type: 'client_error',
    metadata: {
      message: errorMessage,
      stack: errorStack?.substring(0, 500), // Limit stack trace length
      timestamp: new Date().toISOString(),
      context
    }
  });
};

/**
 * Log API error
 */
export const logApiError = async (endpoint: string, error: any, context?: Record<string, any>): Promise<void> => {
  await logActivity({
    event_type: 'api_error',
    event_subtype: endpoint,
    metadata: {
      endpoint,
      error: error?.message || String(error),
      status: error?.status,
      timestamp: new Date().toISOString(),
      context
    }
  });
};

/**
 * Log button click or user interaction
 */
export const logButtonClick = async (buttonId: string, context?: Record<string, any>): Promise<void> => {
  await logActivity({
    event_type: 'button_click',
    event_subtype: buttonId,
    metadata: {
      buttonId,
      timestamp: new Date().toISOString(),
      context
    }
  });
};