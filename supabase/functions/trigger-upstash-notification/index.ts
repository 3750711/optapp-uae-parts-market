import { createServiceClient } from "../_shared/client.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("🚀 trigger-upstash-notification function started");

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { notificationType, payload } = await req.json();
    
    console.log(`📨 [Upstash Trigger] Received request:`, {
      notificationType,
      payloadKeys: Object.keys(payload || {})
    });

    if (!notificationType) {
      return new Response(
        JSON.stringify({ error: 'notificationType is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get QStash token
    const qstashToken = Deno.env.get('QSTASH_TOKEN');
    if (!qstashToken) {
      console.error('❌ QSTASH_TOKEN not found');
      return new Response(
        JSON.stringify({ error: 'QStash configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createServiceClient();

    // Get authenticated user for user-initiated actions
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (!userError && user) {
        userId = user.id;
      }
    }

    // Validate permissions based on notification type
    if (notificationType === 'product' && userId) {
      // Check product ownership
      const { data: product } = await supabase
        .from('products')
        .select('user_id')
        .eq('id', payload.productId)
        .single();

      if (!product || product.user_id !== userId) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Product not found or not owned by user' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check cooldown for non-admin users
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, last_notification_sent_at')
        .eq('id', userId)
        .single();

      if (!profile?.is_admin) {
        const lastNotification = product.last_notification_sent_at;
        if (lastNotification) {
          const hoursSinceLastNotification = (Date.now() - new Date(lastNotification).getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastNotification < 72) {
            const hoursRemaining = Math.ceil(72 - hoursSinceLastNotification);
            return new Response(
              JSON.stringify({ 
                error: 'Cooldown active',
                hoursRemaining,
                message: `Please wait ${hoursRemaining} more hours before sending another notification`
              }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    }

    if ((notificationType === 'bulk' || notificationType === 'personal') && userId) {
      // Check admin privileges
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (!profile?.is_admin) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get QStash endpoint name from app_settings
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('qstash_endpoint_name')
      .eq('id', 1)
      .single();

    if (settingsError || !settings?.qstash_endpoint_name) {
      console.error('❌ Failed to get QStash endpoint:', settingsError);
      return new Response(
        JSON.stringify({ error: 'QStash endpoint configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const qstashEndpoint = settings.qstash_endpoint_name;
    console.log(`🎯 [QStash] Using endpoint: ${qstashEndpoint}`);

    // Prepare deduplication ID
    const timestamp = Date.now();
    const deduplicationId = `${notificationType}-${payload.productId || payload.userId || payload.orderId || 'bulk'}-${timestamp}`;

    // Prepare message for queue
    const queueMessage = {
      notificationType,
      payload: {
        ...payload,
        triggeredAt: new Date().toISOString(),
        triggeredBy: userId
      }
    };

    console.log(`📤 [QStash] Publishing to queue:`, {
      endpoint: qstashEndpoint,
      deduplicationId,
      notificationType
    });

    // Publish to QStash
    const qstashResponse = await fetch(
      `https://qstash.upstash.io/v2/publish/${qstashEndpoint}/telegram-notification-queue`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${qstashToken}`,
          'Content-Type': 'application/json',
          'Upstash-Method': 'POST',
          'Upstash-Deduplication-Id': deduplicationId,
          'Upstash-Retries': '3',
        },
        body: JSON.stringify(queueMessage)
      }
    );

    if (!qstashResponse.ok) {
      const errorText = await qstashResponse.text();
      console.error('❌ [QStash] Publish failed:', {
        status: qstashResponse.status,
        statusText: qstashResponse.statusText,
        error: errorText
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to queue notification',
          details: errorText
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const qstashResult = await qstashResponse.json();
    console.log('✅ [QStash] Published successfully:', qstashResult);

    // Estimate delay based on queue
    const estimatedDelay = Math.ceil((qstashResult.queueLength || 0) * 0.5); // 0.5 seconds per message

    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          messageId: qstashResult.messageId,
          queueLength: qstashResult.queueLength || 0,
          estimatedDelay,
          deduplicationId
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 [Upstash Trigger] Exception:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
