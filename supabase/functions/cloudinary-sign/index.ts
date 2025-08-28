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

    // Get JWT token and verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Create Supabase client to verify JWT and check admin role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.user_type !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Parse request body
    const { orderId, sessionId }: SignRequest = await req.json();

    // Validate that either orderId or sessionId is provided and is valid UUID
    const isValidUUID = (str: string) => 
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

    let targetId: string;
    let folder: string;
    
    if (orderId && isValidUUID(orderId)) {
      targetId = orderId;
      folder = `orders/${orderId}`;
    } else if (sessionId && isValidUUID(sessionId)) {
      targetId = sessionId;
      folder = `staging/${sessionId}`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Provide either valid orderId or sessionId (UUID v4)' }),
        { status: 400, headers: corsHeaders }
      );
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
      upload_url: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
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