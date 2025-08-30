import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle CORS preflight requests
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎯 HEIC Edge Function: Starting HEIC conversion request');

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const maxSide = parseInt(formData.get('maxSide') as string || '1600');
    const quality = parseFloat(formData.get('quality') as string || '0.82');

    if (!file) {
      return new Response('No file provided', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    console.log('📝 HEIC Edge Function: Processing file', {
      fileName: file.name,
      maxSide,
      quality,
      fileSize: file.size
    });

    // For now, return an error as ImageMagick spawn is not available in Supabase Edge Runtime
    // This function serves as a fallback placeholder
    console.error('💥 HEIC Edge Function: ImageMagick not available in Edge Runtime');
    
    return new Response('HEIC conversion not supported in Edge Functions', { 
      status: 501,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('💥 HEIC Edge Function: Error:', error);
    return new Response(`Internal server error: ${error.message}`, {
      status: 500,
      headers: corsHeaders
    });
  }
});