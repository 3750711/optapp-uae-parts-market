import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from './config.ts'
import { verifyAdminAccess } from './auth-utils.ts'
import { sendBulkMessages } from './bulk-message.ts'

console.log('🚀 Bulk Message Function starting up...')

serve(async (req) => {
  console.log('=== BULK MESSAGE FUNCTION CALLED ===')
  console.log('URL:', req.url)
  console.log('Method:', req.method)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get auth header and verify admin access
    const authHeader = req.headers.get('Authorization')
    console.log('=== ADMIN VERIFICATION START ===')
    
    const adminUser = await verifyAdminAccess(supabase, authHeader)
    console.log('Admin permissions verified for user:', adminUser.id)

    // Parse request body
    const { recipients, messageText, images = [] } = await req.json()
    console.log('Request data parsed:', { 
      recipients: Array.isArray(recipients) ? `${recipients.length} recipients` : recipients,
      messageText: `${messageText?.length || 0} chars`,
      images: `${images.length} images`
    })

    // Validate required fields
    if (!recipients || (!Array.isArray(recipients) && typeof recipients !== 'string')) {
      throw new Error('Recipients list is required')
    }
    
    if (!messageText || messageText.trim().length === 0) {
      throw new Error('Message text is required')
    }

    console.log('=== ADMIN VERIFICATION SUCCESS ===')
    
    // === MIGRATED TO QSTASH ===
    console.log('📮 [Bulk] Publishing to QStash queue');
    
    const { getQStashConfig, publishToQueue, generateDeduplicationId } = await import('../_shared/qstash-config.ts');
    
    const qstashConfig = await getQStashConfig();
    const deduplicationId = generateDeduplicationId('bulk', `${adminUser.id}-${Date.now()}`);
    
    const result = await publishToQueue(
      qstashConfig,
      'bulk',
      {
        recipients,
        messageText,
        images: images || [],
        adminUserId: adminUser.id
      },
      deduplicationId
    );
    
    console.log('✅ [Bulk] Queued via QStash:', result.messageId)
    
    console.log('Bulk messages queued via QStash')
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Bulk messages queued via QStash',
      qstash_message_id: result.messageId,
      recipients_type: Array.isArray(recipients) ? 'array' : recipients
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in bulk message function:', error)
    
    let statusCode = 500
    let errorMessage = 'Internal server error'
    
    if (error.message.includes('Admin access required')) {
      statusCode = 403
      errorMessage = 'Admin access required'
    } else if (error.message.includes('required')) {
      statusCode = 400
      errorMessage = error.message
    }
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    )
  }
})