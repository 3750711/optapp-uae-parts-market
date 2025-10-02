import { createServiceClient } from '../_shared/client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// Performance Metrics
// ============================================================================
interface EdgeMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalEventsProcessed: number;
  averageProcessingTime: number;
  rateLimitHits: number;
}

const edgeMetrics: EdgeMetrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalEventsProcessed: 0,
  averageProcessingTime: 0,
  rateLimitHits: 0
};

// ============================================================================
// Rate Limiting Configuration
// ============================================================================
const RATE_LIMITS = {
  maxEventsPerRequest: 100,
  maxEventsPerMinute: 1000
};

// Simple in-memory rate limiter (for production use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string | null): boolean {
  const key = userId || 'anonymous';
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (entry.count >= RATE_LIMITS.maxEventsPerMinute) {
    edgeMetrics.rateLimitHits++;
    console.warn(`⚠️ Rate limit exceeded for ${key}:`, entry.count);
    return false;
  }

  entry.count++;
  return true;
}

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

interface ActivityEvent {
  // Support both old and new formats
  event_type?: 'login' | 'logout' | 'page_view' | 'button_click' | 'api_error' | 'client_error';
  action_type?: string;
  entity_type?: string;
  entity_id?: string;
  event_subtype?: string;
  path?: string;
  metadata?: Record<string, any>;
  details?: Record<string, any>;
  user_id?: string;
  user_agent?: string;
}

interface RequestBody {
  events: ActivityEvent[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const startTime = performance.now();
    edgeMetrics.totalRequests++;
    
    const supabase = createServiceClient();
    console.log('📥 Processing activity logging request');
    
    // Get user from auth header (optional for some events)
    const authHeader = req.headers.get('Authorization');
    let authenticatedUser = null;

    if (authHeader) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (!authError && user) {
        authenticatedUser = user;
      }
    }

    // Parse request body
    const body: RequestBody = await req.json();

    if (!body.events || !Array.isArray(body.events)) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate array size
    if (body.events.length > RATE_LIMITS.maxEventsPerRequest) {
      return new Response(
        JSON.stringify({ 
          error: `Too many events. Maximum ${RATE_LIMITS.maxEventsPerRequest} per request` 
        }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limit
    if (!checkRateLimit(authenticatedUser?.id || null)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract client info from headers
    const userAgent = req.headers.get('User-Agent') || undefined;
    const forwardedFor = req.headers.get('X-Forwarded-For') || 
                         req.headers.get('X-Real-IP') || 
                         undefined;

    // Prepare events for insertion - support both formats
    const eventsToInsert = body.events.map(event => {
      // Support new format (already transformed on client)
      if (event.action_type) {
        return {
          action_type: event.action_type,
          entity_type: event.entity_type || 'user_activity',
          entity_id: event.entity_id || event.user_id || authenticatedUser?.id || null,
          user_id: event.user_id || authenticatedUser?.id || null,
          event_subtype: event.event_subtype || null,
          path: event.path || null,
          ip_address: forwardedFor || null,
          user_agent: event.user_agent || userAgent || null,
          details: event.details || {}
        };
      }
      
      // Support old format (legacy)
      return {
        action_type: event.event_type || 'unknown',
        entity_type: 'user_activity',
        entity_id: event.user_id || authenticatedUser?.id || null,
        user_id: event.user_id || authenticatedUser?.id || null,
        event_subtype: event.event_subtype || null,
        path: event.path || null,
        ip_address: forwardedFor || null,
        user_agent: userAgent || null,
        details: {
          ...event.metadata,
          timestamp: new Date().toISOString(),
          authenticated: !!authenticatedUser
        }
      };
    });

    const { error: insertError } = await supabase
      .from('event_logs')
      .insert(eventsToInsert);

    if (insertError) {
      console.error('❌ Error inserting activity logs:', {
        error: insertError,
        eventsCount: eventsToInsert.length,
        userId: authenticatedUser?.id,
        sampleEvent: eventsToInsert[0]
      });
      return new Response(JSON.stringify({ 
        error: 'Failed to store activity logs', 
        details: insertError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const processingTime = performance.now() - startTime;
    edgeMetrics.successfulRequests++;
    edgeMetrics.totalEventsProcessed += eventsToInsert.length;
    
    // Update average processing time
    edgeMetrics.averageProcessingTime = Math.round(
      (edgeMetrics.averageProcessingTime * (edgeMetrics.totalRequests - 1) + processingTime) / 
      edgeMetrics.totalRequests
    );
    
    console.log(`✅ Successfully inserted ${eventsToInsert.length} events in ${processingTime.toFixed(0)}ms`);
    console.log('📊 Metrics:', {
      totalRequests: edgeMetrics.totalRequests,
      successRate: `${((edgeMetrics.successfulRequests / edgeMetrics.totalRequests) * 100).toFixed(1)}%`,
      avgProcessingTime: `${edgeMetrics.averageProcessingTime}ms`,
      totalEventsProcessed: edgeMetrics.totalEventsProcessed
    });

    return new Response(JSON.stringify({ 
      success: true, 
      inserted: eventsToInsert.length,
      processingTime: Math.round(processingTime)
    }), {
      status: 202,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    edgeMetrics.failedRequests++;
    console.error('❌ Error in log-activity function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});