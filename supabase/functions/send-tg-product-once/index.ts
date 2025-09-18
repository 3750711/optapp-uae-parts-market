import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createEdgeFunctionClient } from '../_shared/client.ts'
import { sendProductNotification } from '../send-telegram-notification/product-notification.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { productId } = await req.json()
    
    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'Product ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createEdgeFunctionClient()
    
    // Check product and notification status
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()
    
    if (productError || !product) {
      console.error('Product not found:', productError)
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If not pending, nothing to do
    if (product.tg_notify_status !== 'pending') {
      console.log(`Product ${productId} notification status is ${product.tg_notify_status}, skipping`)
      return new Response(
        JSON.stringify({ message: 'Notification already processed' }),
        { status: 204, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const MAX_ATTEMPTS = Number(Deno.env.get('TG_MAX_ATTEMPTS') ?? '5')
    const RETRY_DELAY_MS = Number(Deno.env.get('TG_RETRY_DELAY_MS') ?? '30000') // 30 seconds default

    let lastError = ''
    
    // Retry logic with exponential backoff
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        console.log(`Telegram notification attempt ${attempt}/${MAX_ATTEMPTS} for product ${productId}`)
        
        // Update attempt count
        await supabase
          .from('products')
          .update({ 
            tg_notify_attempts: attempt,
            tg_notify_error: null 
          })
          .eq('id', productId)

        // Try to send notification using existing logic
        const result = await sendProductNotification(supabase, product)
        
        if (result.success) {
          // Success - mark as sent
          await supabase
            .from('products')
            .update({ 
              tg_notify_status: 'sent',
              tg_notify_error: null 
            })
            .eq('id', productId)
          
          console.log(`✅ Product ${productId} notification sent successfully on attempt ${attempt}`)
          return new Response(
            JSON.stringify({ success: true, attempt }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          lastError = result.error || 'Unknown error'
          
          // Check if this is a permanent error (400/403)
          if (result.status === 400 || result.status === 403) {
            await supabase
              .from('products')
              .update({ 
                tg_notify_status: 'failed',
                tg_notify_error: `Permanent error (${result.status}): ${lastError}` 
              })
              .eq('id', productId)
            
            console.error(`❌ Product ${productId} notification failed permanently: ${lastError}`)
            return new Response(
              JSON.stringify({ success: false, error: 'Permanent error', details: lastError }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          // Temporary error - retry if not last attempt
          if (attempt < MAX_ATTEMPTS) {
            console.warn(`⚠️ Product ${productId} notification attempt ${attempt} failed, retrying in ${RETRY_DELAY_MS}ms: ${lastError}`)
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
          }
        }
      } catch (error) {
        lastError = error.message || String(error)
        console.error(`💥 Product ${productId} notification attempt ${attempt} threw error: ${lastError}`)
        
        // If not last attempt, wait and retry
        if (attempt < MAX_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
        }
      }
    }
    
    // All attempts failed - mark as failed
    await supabase
      .from('products')
      .update({ 
        tg_notify_status: 'failed',
        tg_notify_error: `Max attempts (${MAX_ATTEMPTS}) reached. Last error: ${lastError}` 
      })
      .eq('id', productId)
    
    console.error(`❌ Product ${productId} notification failed after ${MAX_ATTEMPTS} attempts: ${lastError}`)
    return new Response(
      JSON.stringify({ success: false, error: 'Max attempts reached', details: lastError }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-tg-product-once function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})