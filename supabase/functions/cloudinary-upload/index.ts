
import { corsHeaders } from '../_shared/cors.ts'

const CLOUDINARY_CLOUD_NAME = 'dcuziurrb';

interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  bytes: number;
  format: string;
  version: number;
  duration?: number; // For videos
  resource_type: 'image' | 'video';
}

interface UploadResponse {
  success: boolean;
  publicId?: string;
  cloudinaryUrl?: string;
  mainImageUrl?: string;
  originalSize?: number;
  compressedSize?: number;
  format?: string;
  duration?: number;
  thumbnailUrl?: string;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting Cloudinary upload process...');

    const { fileData, fileName, productId, customPublicId, isVideo = false } = await req.json();

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
      uploadPreset: uploadPreset || 'undefined',
      isVideo
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
    const publicId = customPublicId || `${isVideo ? 'video' : 'product'}_${productId || Date.now()}_${Date.now()}`;
    
    console.log('📤 Uploading to Cloudinary:', {
      fileName,
      publicId,
      productId,
      cloudName: CLOUDINARY_CLOUD_NAME,
      uploadPreset,
      isVideo,
      fileType: isVideo ? 'video' : 'image'
    });

    // Determine the correct endpoint and data prefix
    const resourceType = isVideo ? 'video' : 'image';
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
    const dataPrefix = isVideo ? 'data:video/mp4;base64,' : 'data:image/jpeg;base64,';

    // Generate signature for authenticated upload
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Different transformations for video and image
    const transformation = isVideo 
      ? 'q_auto:low,f_auto,c_limit,w_1920,h_1080' // Video optimization
      : 'q_auto:low,f_auto,c_limit,w_2000,h_2000'; // Image optimization
    
    const stringToSign = `folder=products&public_id=${publicId}&timestamp=${timestamp}&transformation=${transformation}${apiSecret}`;
    
    // Create SHA1 hash for signature
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Prepare form data for Cloudinary upload
    const formData = new FormData();
    formData.append('file', `${dataPrefix}${fileData}`);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('public_id', publicId);
    formData.append('folder', 'products');
    formData.append('transformation', transformation);

    console.log(`☁️ Uploading ${resourceType}...`);
    console.log('🌐 Upload URL:', uploadUrl);
    
    // Upload to Cloudinary
    const uploadResponse = await fetch(uploadUrl, {
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
      dimensions: isVideo ? 'video' : `${cloudinaryResult.width}x${cloudinaryResult.height}`,
      format: cloudinaryResult.format,
      version: cloudinaryResult.version,
      duration: cloudinaryResult.duration,
      resourceType: cloudinaryResult.resource_type
    });

    let response: UploadResponse;

    if (isVideo) {
      // For videos, return the optimized URL directly
      response = {
        success: true,
        publicId: cloudinaryResult.public_id,
        cloudinaryUrl: cloudinaryResult.secure_url,
        originalSize: cloudinaryResult.bytes,
        format: cloudinaryResult.format,
        duration: cloudinaryResult.duration
      };
    } else {
      // For images, generate compressed main image URL
      const mainImageUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/q_auto:low,f_auto,c_limit,w_1920,h_1920/${cloudinaryResult.public_id}`;
      const estimatedMainSize = Math.round(cloudinaryResult.bytes * 0.3); // ~400KB

      response = {
        success: true,
        publicId: cloudinaryResult.public_id,
        mainImageUrl,
        originalSize: cloudinaryResult.bytes,
        compressedSize: estimatedMainSize
      };
    }

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
