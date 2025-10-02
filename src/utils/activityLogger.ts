import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

const IS_PRODUCTION = import.meta.env.PROD;

// ============================================================================
// Performance Monitoring Metrics
// ============================================================================
interface PerformanceMetrics {
  totalEvents: number;
  successfulBatches: number;
  failedBatches: number;
  averageBatchSize: number;
  averageFlushTime: number;
  queueSize: number;
  rateLimitHits: number;
  lastFlushTime: number | null;
  errors: Array<{ timestamp: number; message: string }>;
}

const metrics: PerformanceMetrics = {
  totalEvents: 0,
  successfulBatches: 0,
  failedBatches: 0,
  averageBatchSize: 0,
  averageFlushTime: 0,
  queueSize: 0,
  rateLimitHits: 0,
  lastFlushTime: null,
  errors: []
};

/**
 * Get current performance metrics
 */
export function getActivityMetrics(): PerformanceMetrics {
  return { 
    ...metrics, 
    queueSize: eventBatch.length,
    errors: metrics.errors.slice(-10) // Last 10 errors only
  };
}

/**
 * Reset performance metrics
 */
export function resetActivityMetrics(): void {
  metrics.totalEvents = 0;
  metrics.successfulBatches = 0;
  metrics.failedBatches = 0;
  metrics.averageBatchSize = 0;
  metrics.averageFlushTime = 0;
  metrics.rateLimitHits = 0;
  metrics.lastFlushTime = null;
  metrics.errors = [];
}

// ============================================================================
// Batching Configuration
// ============================================================================
const BATCH_CONFIG = {
  maxSize: 50, // Maximum events per batch
  flushInterval: 5000, // Flush every 5 seconds
  criticalEvents: ['api_error', 'client_error', 'login', 'logout'], // Send immediately
};

let eventBatch: any[] = [];
let batchTimer: NodeJS.Timeout | null = null;

// ============================================================================
// Debounce Configuration
// ============================================================================
const DEBOUNCE_INTERVALS = {
  page_view: 1000,
  button_click: 300,
};

const debounceTimers = new Map<string, NodeJS.Timeout>();

export interface ActivityEvent {
  event_type: 'login' | 'logout' | 'page_view' | 'button_click' | 'api_error' | 'client_error';
  event_subtype?: string;
  path?: string;
  metadata?: Record<string, any>;
  user_id?: string | null;
}

// ============================================================================
// Rate Limiting Configuration
// ============================================================================
const EVENT_RATE_LIMITS = {
  page_view: { maxEvents: 100, windowMs: 60000 }, // 100 in a minute
  button_click: { maxEvents: 200, windowMs: 60000 }, // 200 in a minute
  api_error: { maxEvents: 50, windowMs: 60000 },
  client_error: { maxEvents: 30, windowMs: 60000 }
};

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitCache = new Map<string, RateLimitEntry>();

/**
 * Check if the event type is within the rate limit
 */
function checkRateLimit(eventType: string, userId?: string): boolean {
  const limit = EVENT_RATE_LIMITS[eventType as keyof typeof EVENT_RATE_LIMITS];
  if (!limit) return true; // No limit for this event type

  const key = `${eventType}:${userId || 'anonymous'}`;
  const now = Date.now();
  const entry = rateLimitCache.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitCache.set(key, { count: 1, resetTime: now + limit.windowMs });
    return true;
  }

  if (entry.count >= limit.maxEvents) {
    metrics.rateLimitHits++;
    logger.warn('Rate limit exceeded for activity logging', {
      eventType,
      userId: userId ? '***' : undefined,
      count: entry.count,
      limit: limit.maxEvents
    });
    return false;
  }

  entry.count++;
  return true;
}

// ============================================================================
// Batch Management
// ============================================================================
async function flushBatch() {
  if (eventBatch.length === 0) return;
  
  const startTime = performance.now();
  const batchToSend = [...eventBatch];
  const batchSize = batchToSend.length;
  eventBatch = [];
  
  try {
    const { error } = await supabase.functions.invoke('log-activity', {
      body: { events: batchToSend }
    });
    
    const flushTime = performance.now() - startTime;
    
    if (error) {
      metrics.failedBatches++;
      metrics.errors.push({
        timestamp: Date.now(),
        message: error.message || 'Unknown error'
      });
      
      if (!IS_PRODUCTION) {
        logger.warn('Failed to send event batch', { error: error.message, batchSize, flushTime });
      }
    } else {
      // Update success metrics
      metrics.successfulBatches++;
      metrics.totalEvents += batchSize;
      metrics.lastFlushTime = Date.now();
      
      // Update average batch size
      const totalBatches = metrics.successfulBatches + metrics.failedBatches;
      metrics.averageBatchSize = Math.round(
        (metrics.averageBatchSize * (totalBatches - 1) + batchSize) / totalBatches
      );
      
      // Update average flush time
      metrics.averageFlushTime = Math.round(
        (metrics.averageFlushTime * (totalBatches - 1) + flushTime) / totalBatches
      );
      
      if (!IS_PRODUCTION) {
        logger.log(`✅ Batch flushed: ${batchSize} events in ${flushTime.toFixed(0)}ms`);
      }
    }
  } catch (err) {
    metrics.failedBatches++;
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    metrics.errors.push({
      timestamp: Date.now(),
      message: errorMsg
    });
    
    if (!IS_PRODUCTION) {
      logger.error('Error sending event batch', { error: errorMsg, batchSize });
    }
  }
}

function scheduleBatchFlush() {
  if (batchTimer) return;
  
  batchTimer = setTimeout(() => {
    flushBatch();
    batchTimer = null;
  }, BATCH_CONFIG.flushInterval);
}

function addToBatch(event: any) {
  eventBatch.push(event);
  
  // Flush if batch is full or event is critical
  if (
    eventBatch.length >= BATCH_CONFIG.maxSize ||
    BATCH_CONFIG.criticalEvents.includes(event.action_type)
  ) {
    if (batchTimer) {
      clearTimeout(batchTimer);
      batchTimer = null;
    }
    flushBatch();
  } else {
    scheduleBatchFlush();
  }
}

// ============================================================================
// Browser Lifecycle Management
// ============================================================================
if (typeof window !== 'undefined') {
  // Periodic cleanup of rate limit cache
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitCache.entries()) {
      if (now > entry.resetTime) {
        rateLimitCache.delete(key);
      }
    }
  }, 60000); // Every minute
  
  // Flush batch on page unload using sendBeacon for reliability
  window.addEventListener('beforeunload', () => {
    if (eventBatch.length > 0) {
      // Use sendBeacon for guaranteed delivery even when page closes
      const beaconData = JSON.stringify({
        events: eventBatch.map(e => ({
          action_type: e.action_type,
          entity_type: e.entity_type,
          entity_id: e.entity_id,
          user_id: e.user_id,
          event_subtype: e.event_subtype,
          path: e.path,
          user_agent: e.user_agent,
          details: e.details
        }))
      });
      
      const url = `${supabase.supabaseUrl}/functions/v1/log-activity`;
      
      // sendBeacon guarantees delivery even on page close
      if (navigator.sendBeacon) {
        const blob = new Blob([beaconData], { type: 'application/json' });
        const headers = new Headers();
        const session = supabase.auth.session();
        if (session?.access_token) {
          // Note: sendBeacon doesn't support custom headers, so we encode auth in the body
          const beaconDataWithAuth = JSON.stringify({
            ...JSON.parse(beaconData),
            _auth: session.access_token
          });
          navigator.sendBeacon(url, new Blob([beaconDataWithAuth], { type: 'application/json' }));
        } else {
          navigator.sendBeacon(url, blob);
        }
      } else {
        // Fallback for older browsers
        flushBatch().catch(() => {});
      }
      
      eventBatch.length = 0;
    }
  });
  
  // Also try to flush on visibility change (when tab becomes hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && eventBatch.length > 0) {
      flushBatch().catch(() => {
        // Silent failure is ok here
      });
    }
  });
}

/**
 * Centralized logging for user activity events with batching and debouncing
 */
export const logActivity = async (event: ActivityEvent): Promise<void> => {
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    const userId = event.user_id || currentUser?.id || null;

    // Check rate limit
    if (!checkRateLimit(event.event_type, userId || undefined)) {
      return; // Silently skip event due to rate limit
    }

    // Get browser info for context
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : undefined;
    const currentPath = event.path || (typeof window !== 'undefined' ? window.location.pathname : undefined);

    // Log to console for debugging (only in dev)
    if (!IS_PRODUCTION) {
      const logLevel = event.event_type.includes('error') ? 'error' : 'info';
      logger[logLevel](`Activity Event: ${event.event_type}`, {
        event_subtype: event.event_subtype,
        path: currentPath,
        hasMetadata: !!event.metadata,
        userId: userId ? '***' : undefined
      });
    }

    // Prepare event data
    const eventData = {
      action_type: event.event_type,
      entity_type: 'user_activity',
      entity_id: userId,
      user_id: userId,
      event_subtype: event.event_subtype,
      path: currentPath,
      user_agent: IS_PRODUCTION ? undefined : userAgent, // Strip user agent in prod
      details: {
        metadata: IS_PRODUCTION ? {} : event.metadata, // Strip metadata in prod
        timestamp: new Date().toISOString()
      }
    };

    // Debounce for frequent events
    const debounceInterval = DEBOUNCE_INTERVALS[event.event_type as keyof typeof DEBOUNCE_INTERVALS];
    if (debounceInterval) {
      const debounceKey = `${event.event_type}:${currentPath}:${userId}`;
      const existingTimer = debounceTimers.get(debounceKey);
      
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      
      const timer = setTimeout(() => {
        debounceTimers.delete(debounceKey);
        addToBatch(eventData);
      }, debounceInterval);
      
      debounceTimers.set(debounceKey, timer);
      return;
    }

    // Add to batch (critical events will flush immediately)
    addToBatch(eventData);

  } catch (error) {
    if (!IS_PRODUCTION) {
      logger.error('Failed to log activity event', {
        event_type: event.event_type,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
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