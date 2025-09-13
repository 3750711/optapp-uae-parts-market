import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// SHA-1 implementation for Cloudinary signature
const sha1 = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(hash))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};

interface SignRequest {
  orderId?: string;
  sessionId?: string;
}

interface SignResponse {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  folder: string;
  public_id: string;
  signature: string;
  upload_url: string;
  // Additional fields for chunked uploads
  chunk_size?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    // Public endpoint - no authentication required for staging uploads

    // Parse request body
    const { orderId, sessionId }: SignRequest = await req.json();

    // FIXED: More flexible identifier validation
    const isValidIdentifier = (str: string) => {
      if (!str) return false;
      
      // Accept:
      // 1. Any valid UUID (not only v4)
      // 2. Strings longer than 10 chars (for legacy IDs)
      // 3. Numeric IDs converted to string
      
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
      const isLegacyId = str.length >= 10 && /^[a-zA-Z0-9_-]+$/.test(str);
      
      return isUUID || isLegacyId;
    };

    let targetId: string;
    let folder: string;
    
    console.log('🔍 Validating identifiers:', { orderId, sessionId });
    
    if (orderId && isValidIdentifier(orderId)) {
      targetId = orderId;
      folder = `orders/${orderId}`;
      console.log('✅ Using orderId:', { targetId, folder });
    } else if (sessionId && isValidIdentifier(sessionId)) {
      targetId = sessionId;
      folder = `staging/${sessionId}`;
      console.log('✅ Using sessionId:', { targetId, folder });
    } else {
      // FALLBACK: Use temporary ID instead of error
      targetId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      folder = `temp/${targetId}`;
      
      console.warn('⚠️ Using fallback ID:', { 
        targetId, 
        folder, 
        originalOrderId: orderId, 
        originalSessionId: sessionId 
      });
    }

    // Get Cloudinary credentials
    const CLOUD_NAME = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const API_KEY = Deno.env.get('CLOUDINARY_API_KEY');
    const API_SECRET = Deno.env.get('CLOUDINARY_API_SECRET');

    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      console.error('Missing Cloudinary credentials');
      const missing = [];
      if (!CLOUD_NAME) missing.push('CLOUDINARY_CLOUD_NAME');
      if (!API_KEY) missing.push('CLOUDINARY_API_KEY');
      if (!API_SECRET) missing.push('CLOUDINARY_API_SECRET');
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error', 
          missing 
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Generate signature parameters
    const timestamp = Math.floor(Date.now() / 1000);
    const public_id = `o_${targetId}_${timestamp}_${crypto.randomUUID().slice(0, 8)}`;

    // Create signature string (alphabetically sorted parameters)
    const signatureString = `folder=${folder}&public_id=${public_id}&timestamp=${timestamp}`;
    const signature = await sha1(signatureString + API_SECRET);

    const signatureData: SignResponse = {
      cloud_name: CLOUD_NAME,
      api_key: API_KEY,
      timestamp,
      folder,
      public_id,
      signature,
      upload_url: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      chunk_size: 6 * 1024 * 1024 // 6MB chunks for large uploads
    };

    // Return canonical contract: {success: true, data: {...}}
    const response = {
      success: true,
      data: signatureData
    };

    console.log('Generated Cloudinary signature for targetId:', targetId, 'folder:', folder);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});