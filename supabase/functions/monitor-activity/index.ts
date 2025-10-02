import { createServiceClient } from '../_shared/client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: {
      status: 'ok' | 'error';
      latency?: number;
      error?: string;
    };
    eventLogs: {
      status: 'ok' | 'error';
      recentEvents?: number;
      oldestEvent?: string;
      error?: string;
    };
    performance: {
      status: 'ok' | 'warning' | 'error';
      avgInsertTime?: number;
      errorRate?: number;
      warning?: string;
    };
  };
  metrics: {
    totalEvents: number;
    eventsLast24h: number;
    eventsLastHour: number;
    uniqueUsers24h: number;
    errorCount24h: number;
    topEventTypes: Array<{ event_type: string; count: number }>;
  };
  timestamp: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createServiceClient();
    const result: HealthCheckResult = {
      status: 'healthy',
      checks: {
        database: { status: 'ok' },
        eventLogs: { status: 'ok' },
        performance: { status: 'ok' }
      },
      metrics: {
        totalEvents: 0,
        eventsLast24h: 0,
        eventsLastHour: 0,
        uniqueUsers24h: 0,
        errorCount24h: 0,
        topEventTypes: []
      },
      timestamp: new Date().toISOString()
    };

    // 1. Check database connectivity
    const dbStartTime = performance.now();
    try {
      const { error: dbError } = await supabase
        .from('event_logs')
        .select('id', { count: 'exact', head: true });
      
      const dbLatency = performance.now() - dbStartTime;
      
      if (dbError) {
        result.checks.database = {
          status: 'error',
          latency: dbLatency,
          error: dbError.message
        };
        result.status = 'unhealthy';
      } else {
        result.checks.database = {
          status: 'ok',
          latency: Math.round(dbLatency)
        };
      }
    } catch (err) {
      result.checks.database = {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      };
      result.status = 'unhealthy';
    }

    // 2. Check event logs health
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

      // Get recent events count
      const { count: recentCount, error: recentError } = await supabase
        .from('event_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastHour.toISOString());

      // Get oldest event
      const { data: oldestData, error: oldestError } = await supabase
        .from('event_logs')
        .select('created_at')
        .order('created_at', { ascending: true })
        .limit(1);

      if (recentError || oldestError) {
        result.checks.eventLogs = {
          status: 'error',
          error: recentError?.message || oldestError?.message
        };
        result.status = 'degraded';
      } else {
        result.checks.eventLogs = {
          status: 'ok',
          recentEvents: recentCount || 0,
          oldestEvent: oldestData?.[0]?.created_at
        };
      }
    } catch (err) {
      result.checks.eventLogs = {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      };
      result.status = 'degraded';
    }

    // 3. Collect metrics
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

      // Total events
      const { count: totalCount } = await supabase
        .from('event_logs')
        .select('*', { count: 'exact', head: true });
      
      result.metrics.totalEvents = totalCount || 0;

      // Events last 24h
      const { count: count24h } = await supabase
        .from('event_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', last24h.toISOString());
      
      result.metrics.eventsLast24h = count24h || 0;

      // Events last hour
      const { count: countHour } = await supabase
        .from('event_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastHour.toISOString());
      
      result.metrics.eventsLastHour = countHour || 0;

      // Unique users last 24h
      const { data: uniqueUsersData } = await supabase
        .from('event_logs')
        .select('user_id')
        .gte('created_at', last24h.toISOString())
        .not('user_id', 'is', null);
      
      const uniqueUsers = new Set(uniqueUsersData?.map(e => e.user_id) || []);
      result.metrics.uniqueUsers24h = uniqueUsers.size;

      // Error count last 24h
      const { count: errorCount } = await supabase
        .from('event_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', last24h.toISOString())
        .in('action_type', ['api_error', 'client_error']);
      
      result.metrics.errorCount24h = errorCount || 0;

      // Top event types
      const { data: topEventsData } = await supabase
        .from('event_logs')
        .select('action_type')
        .gte('created_at', last24h.toISOString());
      
      const eventCounts = new Map<string, number>();
      topEventsData?.forEach(e => {
        eventCounts.set(e.action_type, (eventCounts.get(e.action_type) || 0) + 1);
      });
      
      result.metrics.topEventTypes = Array.from(eventCounts.entries())
        .map(([event_type, count]) => ({ event_type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate error rate
      const errorRate = result.metrics.eventsLast24h > 0 
        ? (result.metrics.errorCount24h / result.metrics.eventsLast24h) * 100 
        : 0;

      // Performance check
      if (errorRate > 10) {
        result.checks.performance = {
          status: 'error',
          errorRate: Math.round(errorRate * 100) / 100,
          warning: 'High error rate detected'
        };
        result.status = 'degraded';
      } else if (errorRate > 5) {
        result.checks.performance = {
          status: 'warning',
          errorRate: Math.round(errorRate * 100) / 100,
          warning: 'Elevated error rate'
        };
        if (result.status === 'healthy') {
          result.status = 'degraded';
        }
      } else {
        result.checks.performance = {
          status: 'ok',
          errorRate: Math.round(errorRate * 100) / 100
        };
      }

    } catch (err) {
      console.error('Error collecting metrics:', err);
      result.status = 'degraded';
    }

    console.log('📊 Health check completed:', result.status);

    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in monitor-activity function:', error);
    return new Response(JSON.stringify({ 
      status: 'unhealthy',
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
