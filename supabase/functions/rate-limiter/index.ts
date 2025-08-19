import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

interface RateLimitRequest {
  userId: string;
  action: string;
  limitPerHour?: number;
  windowMinutes?: number;
}

interface RateLimitResponse {
  allowed: boolean;
  remainingRequests: number;
  resetTime: string;
  message?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const { userId, action, limitPerHour = 60, windowMinutes = 60 }: RateLimitRequest = await req.json();

    if (!userId || !action) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: userId and action' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate time window
    const windowStart = new Date(Date.now() - (windowMinutes * 60 * 1000));

    // Count recent actions for this user
    const { data: recentActions, error: countError } = await supabaseClient
      .from('event_logs')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('action_type', action)
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: false });

    if (countError) {
      console.error('Error counting recent actions:', countError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to check rate limit', 
          details: countError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const currentCount = recentActions?.length || 0;
    const remainingRequests = Math.max(0, limitPerHour - currentCount);
    const resetTime = new Date(Date.now() + (windowMinutes * 60 * 1000)).toISOString();

    // Check if limit exceeded
    if (currentCount >= limitPerHour) {
      // Log rate limit violation
      const { error: logError } = await supabaseClient
        .from('event_logs')
        .insert({
          action_type: 'rate_limit_exceeded',
          entity_type: 'security',
          entity_id: crypto.randomUUID(),
          user_id: userId,
          details: {
            action,
            current_count: currentCount,
            limit_per_hour: limitPerHour,
            window_minutes: windowMinutes,
            ip_address: req.headers.get('x-forwarded-for') || 'unknown',
            user_agent: req.headers.get('user-agent') || 'unknown',
          }
        });

      if (logError) {
        console.error('Failed to log rate limit violation:', logError);
      }

      const response: RateLimitResponse = {
        allowed: false,
        remainingRequests: 0,
        resetTime,
        message: `Rate limit exceeded. Too many ${action} requests. Please try again later.`
      };

      return new Response(
        JSON.stringify(response),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(windowMinutes * 60).toString()
          } 
        }
      );
    }

    // Rate limit check passed
    const response: RateLimitResponse = {
      allowed: true,
      remainingRequests,
      resetTime,
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Rate limiter error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: 'Rate limit check failed' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});