import { getQStashConfig, publishToQueue } from '../_shared/qstash-config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 Testing QStash Direct Publish configuration...');
    
    // Get config
    const config = await getQStashConfig();
    console.log(`✅ Config loaded: ${config.endpointUrl}`);
    
    // Publish test message
    const result = await publishToQueue(
      config,
      'test',
      {
        timestamp: new Date().toISOString(),
        message: 'Test message from test-qstash-queue'
      },
      `test-${Date.now()}`
    );
    
    return new Response(
      JSON.stringify({
        success: true,
        config: {
          endpointUrl: config.endpointUrl,
          publishUrl: config.publishUrl
        },
        result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
