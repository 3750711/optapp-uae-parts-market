import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://partsbay.ae',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    // Create Supabase client for auth verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? "",
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    );

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    await verifyAdminAccess(supabaseClient, authHeader || '');

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