import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://partsbay.ae',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Authentication utilities
async function verifyAdminAccess(supabaseClient: any, authHeader: string) {
  console.log('=== ADMIN VERIFICATION START ===');
  
  if (!authHeader) {
    console.error('No authorization header provided');
    throw new Error('Missing authorization header');
  }

  const token = authHeader.replace('Bearer ', '').trim();
  console.log('Token extracted, length:', token.length);
  
  if (!token || token.length < 20) {
    console.error('Invalid token format or length');
    throw new Error('Invalid token format');
  }

  const supabaseWithAuth = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    }
  );

  const { data: { user }, error: authError } = await supabaseWithAuth.auth.getUser(token);

  if (authError || !user) {
    console.error('Authentication failed:', authError?.message || 'No user found');
    throw new Error(`Authentication failed: ${authError?.message || 'Invalid or expired token'}`);
  }

  console.log('User authenticated:', user.id);

  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching user profile:', profileError.message);
    throw new Error(`Failed to verify user permissions: ${profileError.message}`);
  }

  if (!profile || profile.user_type !== 'admin') {
    console.error('Admin access denied for user:', user.id, 'type:', profile?.user_type);
    throw new Error('Admin access required');
  }

  console.log('Admin permissions verified for user:', user.id);
  console.log('=== ADMIN VERIFICATION SUCCESS ===');
  
  return user;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    await verifyAdminAccess(supabase, authHeader || '');

    const { productIds, batchSize = 50, statuses = ['active', 'sold'], offset = 0 } = await req.json();
    
    console.log(`🔧 Starting embedding generation: batch=${batchSize}, offset=${offset}, statuses=${statuses.join(',')}, productIds=${productIds?.length || 'all'}`);

    let query = supabase
      .from('products')
      .select('id, title, description, brand, model, condition, price, product_location, status')
      .in('status', statuses)
      .order('id'); // Consistent ordering for pagination

    if (productIds && productIds.length > 0) {
      query = query.in('id', productIds);
    }

    // Always use range for consistent pagination
    query = query.range(offset, offset + batchSize - 1);

    const { data: products, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      throw fetchError;
    }

    console.log(`Processing ${products?.length || 0} products`);

    let processed = 0;
    let updated = 0;
    let errors = 0;

    for (const product of products || []) {
      try {
        // Generate content for embedding
        const content = [
          product.title,
          product.description,
          product.brand,
          product.model,
          product.condition,
          `price ${product.price}`,
          `location ${product.product_location}`
        ].filter(Boolean).join(' ');

        // Calculate content hash
        const contentHash = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(content)
        );
        const hashHex = Array.from(new Uint8Array(contentHash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        // Check if we already have an embedding with this content hash
        const { data: existingEmbedding } = await supabase
          .from('product_embeddings')
          .select('id, content_hash')
          .eq('product_id', product.id)
          .single();

        if (existingEmbedding && existingEmbedding.content_hash === hashHex) {
          console.log(`Skipping product ${product.id} - content unchanged`);
          processed++;
          continue;
        }

        // Generate embedding using OpenAI
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: content,
            encoding_format: 'float',
          }),
        });

        if (!embeddingResponse.ok) {
          throw new Error(`OpenAI API error: ${embeddingResponse.statusText}`);
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // Upsert embedding into database
        const { error: upsertError } = await supabase
          .from('product_embeddings')
          .upsert({
            product_id: product.id,
            embedding,
            content_hash: hashHex,
          });

        if (upsertError) {
          console.error(`Error upserting embedding for product ${product.id}:`, upsertError);
          errors++;
        } else {
          console.log(`Successfully processed product ${product.id}`);
          updated++;
        }

        processed++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error);
        errors++;
        processed++;
      }
    }

    const result = {
      success: true,
      processed,
      updated,
      errors,
      message: `Processed ${processed} products, updated ${updated} embeddings, ${errors} errors`
    };

    console.log('Embedding generation completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-embeddings function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});