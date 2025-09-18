import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createServiceClient } from '../_shared/client.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BackgroundTaskRequest {
  productId: string;
  title: string;
  brand?: string;
  model?: string;
  tasks: ('embeddings' | 'synonyms')[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { productId, title, brand, model, tasks }: BackgroundTaskRequest = await req.json()
    console.log(`🔄 Starting background tasks for product ${productId}:`, tasks)

    const supabase = createServiceClient()
    const results: Record<string, any> = {}
    
    // Generate embeddings if requested
    if (tasks.includes('embeddings')) {
      console.log(`🔍 Generating embedding for product ${productId}`)
      const embeddingStart = performance.now()
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-embeddings', {
          body: { 
            productIds: [productId],
            batchSize: 1 
          }
        })
        
        const embeddingTime = performance.now() - embeddingStart
        console.log(`✅ Embedding generated in ${embeddingTime.toFixed(2)}ms for product ${productId}`)
        
        results.embeddings = {
          success: !error,
          data,
          error: error?.message,
          duration: embeddingTime
        }
      } catch (error) {
        console.error(`❌ Embedding generation failed for product ${productId}:`, error)
        results.embeddings = {
          success: false,
          error: error.message,
          duration: performance.now() - embeddingStart
        }
      }
    }

    // Generate synonyms if requested
    if (tasks.includes('synonyms')) {
      console.log(`🔤 Generating synonyms for product ${productId}`)
      const synonymStart = performance.now()
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-product-synonyms', {
          body: {
            productId,
            title,
            brand,
            model
          }
        })
        
        const synonymTime = performance.now() - synonymStart
        console.log(`✅ Synonyms generated in ${synonymTime.toFixed(2)}ms for product ${productId}`)
        
        results.synonyms = {
          success: !error,
          data,
          error: error?.message,
          duration: synonymTime
        }
      } catch (error) {
        console.error(`❌ Synonym generation failed for product ${productId}:`, error)
        results.synonyms = {
          success: false,
          error: error.message,
          duration: performance.now() - synonymStart
        }
      }
    }

    // Log completion
    console.log(`✅ Background tasks completed for product ${productId}:`, results)

    return new Response(
      JSON.stringify({ 
        success: true, 
        productId,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in process-product-background function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})