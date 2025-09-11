// CORS headers with updated allowlist
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
}

const CLOUDINARY_CLOUD_NAME = 'dcuziurrb';

interface SignResponse {
  success: boolean;
  uploadUrl?: string;
  formData?: Record<string, string>;
  error?: string;
}

// Helper function for guaranteed JSON responses
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

Deno.serve(async (req) => {
  // Generate unique request ID for logging
  const rid = `sign_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // Handle CORS preflight requests  
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    console.log(`📥 [${rid}] Incoming sign request: ${req.method}`);
    
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY')?.trim();
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')?.trim();
    const uploadPreset = Deno.env.get('CLOUDINARY_UPLOAD_PRESET')?.trim();
    
    if (!apiKey || !apiSecret || !uploadPreset) {
      console.error(`❌ [${rid}] Missing Cloudinary credentials`);
      return jsonResponse({
        success: false,
        error: 'Cloudinary credentials not configured properly'
      }, 500);
    }

    // Get request parameters
    const requestData = await req.json();
    const { folder = 'uploads' } = requestData;
    
    console.log(`📁 [${rid}] Generating signature for folder: ${folder}`);

    // Generate optimized public_id
    const timestamp = Date.now();
    const publicId = `${folder}/upload_${timestamp}_${Math.random().toString(36).substring(7)}`;
    
    // Unified transformation for all media formats - convert to WebP for images
    const transformation = 'f_webp,q_auto:good,c_limit,w_1200';
    
    // Parameters for signing
    const signParams = {
      folder,
      public_id: publicId,
      timestamp: Math.round(timestamp / 1000).toString(),
      transformation
    };

    // Generate signature
    const stringToSign = Object.keys(signParams)
      .sort()
      .map(key => `${key}=${signParams[key as keyof typeof signParams]}`)
      .join('&') + apiSecret;
      
    console.log(`🔐 [${rid}] String to sign: ${stringToSign.substring(0, 100)}...`);
    
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Upload URL for auto detection
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
    
    // Form data for the upload
    const formData: Record<string, string> = {
      api_key: apiKey,
      timestamp: signParams.timestamp,
      public_id: publicId,
      folder,
      transformation,
      signature
    };

    console.log(`✅ [${rid}] Signature generated successfully for publicId: ${publicId}`);
    
    const response: SignResponse = {
      success: true,
      uploadUrl,
      formData
    };

    return jsonResponse(response, 200);

  } catch (error) {
    console.error(`❌ [${rid}] Unexpected error in cloudinary-sign:`, error);
    const errorResponse: SignResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };

    return jsonResponse(errorResponse, 500);
  }
});