
import { corsHeaders } from '../_shared/cors.ts'

const CLOUDINARY_CLOUD_NAME = 'dcuziurrb';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  version: number;
}

interface UploadResponse {
  success: boolean;
  publicId?: string;
  mainImageUrl?: string;
  originalSize?: number;
  compressedSize?: number;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting Cloudinary upload process...');

    const { fileData, fileName, productId, customPublicId } = await req.json();

    if (!fileData) {
      throw new Error('No file data provided');
    }

    // Get Cloudinary credentials from environment and clean them
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY')?.trim();
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')?.trim();
    const uploadPreset = Deno.env.get('CLOUDINARY_UPLOAD_PRESET')?.trim();
    
    console.log('🔑 Cloudinary credentials check:', { 
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      hasUploadPreset: !!uploadPreset,
      apiKeyPrefix: apiKey ? `${apiKey.substring(0, 6)}...` : 'undefined',
      apiKeyLength: apiKey ? apiKey.length : 0,
      uploadPreset: uploadPreset || 'undefined'
    });
    
    if (!apiKey || !apiSecret || !uploadPreset) {
      console.error('❌ Missing Cloudinary credentials:', {
        apiKey: !!apiKey,
        apiSecret: !!apiSecret,
        uploadPreset: !!uploadPreset
      });
      throw new Error('Cloudinary credentials not configured properly');
    }

    // Generate public_id
    const publicId = customPublicId || `product_${productId || Date.now()}_${Date.now()}`;
    
    console.log('📤 Uploading to Cloudinary:', {
      fileName,
      publicId,
      productId,
      cloudName: CLOUDINARY_CLOUD_NAME,
      uploadPreset
    });

    // Generate signature for authenticated upload
    const timestamp = Math.round(new Date().getTime() / 1000);
    const stringToSign = `folder=products&public_id=${publicId}&timestamp=${timestamp}&transformation=q_auto:low,f_auto,c_limit,w_2000,h_2000${apiSecret}`;
    
    // Create SHA1 hash for signature
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Prepare form data for Cloudinary upload
    const formData = new FormData();
    formData.append('file', `data:image/jpeg;base64,${fileData}`);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('public_id', publicId);
    formData.append('folder', 'products');
    
    // Auto-optimize and compress to ~400KB for main image
    formData.append('transformation', 'q_auto:low,f_auto,c_limit,w_2000,h_2000');

    console.log('☁️ Uploading original image...');
    console.log('🌐 Upload URL:', CLOUDINARY_UPLOAD_URL);
    
    // Upload original image to Cloudinary
    const uploadResponse = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    console.log('📊 Upload response status:', {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
      ok: uploadResponse.ok
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Cloudinary upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        errorBody: errorText
      });
      throw new Error(`Cloudinary upload failed: ${uploadResponse.status} ${errorText}`);
    }

    const cloudinaryResult: CloudinaryResponse = await uploadResponse.json();
    
    console.log('✅ Cloudinary upload successful:', {
      publicId: cloudinaryResult.public_id,
      originalUrl: cloudinaryResult.secure_url,
      originalSize: cloudinaryResult.bytes,
      dimensions: `${cloudinaryResult.width}x${cloudinaryResult.height}`,
      format: cloudinaryResult.format,
      version: cloudinaryResult.version
    });

    // Generate compressed main image URL (~400KB)
    const mainImageUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/q_auto:low,f_auto,c_limit,w_1920,h_1920/${cloudinaryResult.public_id}`;

    console.log('🎨 Generated main image URL:', {
      mainImageUrl,
      publicId: cloudinaryResult.public_id,
      version: cloudinaryResult.version,
      format: cloudinaryResult.format
    });

    // Estimate compressed sizes based on Cloudinary's compression
    const estimatedMainSize = Math.round(cloudinaryResult.bytes * 0.3); // ~400KB

    const response: UploadResponse = {
      success: true,
      publicId: cloudinaryResult.public_id,
      mainImageUrl,
      originalSize: cloudinaryResult.bytes,
      compressedSize: estimatedMainSize
    };

    console.log('📊 Upload completed successfully:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('💥 Cloudinary upload error:', error);
    
    const errorResponse: UploadResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
