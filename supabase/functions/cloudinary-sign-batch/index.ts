
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

interface BatchSignRequest {
  orderId?: string;
  sessionId?: string;
  publicIds?: string[]; // List of specific public IDs to sign
  count?: number; // Number of signatures to generate (default 5, max 10) - fallback only
}

interface SignatureData {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  folder: string;
  public_id: string;
  signature: string;
  upload_url: string;
}

interface BatchSignResponse {
  success: true;
  data: SignatureData[];
  count: number;
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
    const { orderId, sessionId, publicIds, count = 5 }: BatchSignRequest = await req.json();

    // Log incoming request details for debugging
    console.log('Batch sign request details:', {
      orderId,
      sessionId,
      publicIdsCount: publicIds ? publicIds.length : 0,
      publicIdsProvided: !!publicIds,
      countFallback: count
    });

    // Use provided publicIds if available, otherwise generate count signatures
    let targetPublicIds: string[] = [];
    if (publicIds && Array.isArray(publicIds) && publicIds.length > 0) {
      // Validate and use provided publicIds
      targetPublicIds = publicIds.filter(id => typeof id === 'string' && id.trim().length > 0);
      console.log(`Using provided publicIds: ${targetPublicIds.length} signatures requested`);
    } else {
      // Fallback to count-based generation (removed artificial limit)
      const signatureCount = Math.max(1, count);
      console.log(`Generating ${signatureCount} random publicIds as fallback`);
      for (let i = 0; i < signatureCount; i++) {
        targetPublicIds.push(`product_${crypto.randomUUID().replace(/-/g, '_')}`);
      }
    }

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
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error'
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Generate signatures for the target publicIds
    const signatures: SignatureData[] = [];
    const baseTimestamp = Math.floor(Date.now() / 1000);
    
    for (let i = 0; i < targetPublicIds.length; i++) {
      const timestamp = baseTimestamp + i; // Ensure unique timestamps
      const public_id = targetPublicIds[i];

      // Create signature string (alphabetically sorted parameters)
      const signatureString = `folder=${folder}&public_id=${public_id}&timestamp=${timestamp}`;
      const signature = await sha1(signatureString + API_SECRET);

      signatures.push({
        cloud_name: CLOUD_NAME,
        api_key: API_KEY,
        timestamp,
        folder,
        public_id,
        signature,
        upload_url: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
      });
    }

    const response: BatchSignResponse = {
      success: true,
      data: signatures,
      count: signatures.length
    };

    console.log(`Generated ${signatures.length} Cloudinary signatures for targetId: ${targetId}, folder: ${folder}`);

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
    console.error('Batch sign edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});