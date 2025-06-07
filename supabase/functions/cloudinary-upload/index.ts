
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
  previewImageUrl?: string;
  originalSize?: number;
  compressedSize?: number;
  previewSize?: number;
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

    // Get Cloudinary upload preset from environment
    const uploadPreset = Deno.env.get('CLOUDINARY_UPLOAD_PRESET');
    console.log('🔑 Upload preset check:', { 
      hasPreset: !!uploadPreset, 
      presetValue: uploadPreset ? `${uploadPreset.substring(0, 5)}...` : 'undefined'
    });
    
    if (!uploadPreset) {
      console.error('❌ CLOUDINARY_UPLOAD_PRESET environment variable not found');
      throw new Error('Cloudinary upload preset not configured in environment variables');
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

    // Prepare form data for Cloudinary upload
    const formData = new FormData();
    formData.append('file', `data:image/jpeg;base64,${fileData}`);
    formData.append('upload_preset', uploadPreset);
    formData.append('public_id', publicId);
    formData.append('folder', 'products');
    
    // Auto-optimize and compress to ~400KB for main image
    formData.append('transformation', 'q_auto:low,f_auto,c_limit,w_2000,h_2000');
    formData.append('quality', 'auto:low');
    formData.append('fetch_format', 'auto');

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
      format: cloudinaryResult.format
    });

    // Generate compressed main image URL (~400KB)
    const mainImageUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/q_auto:low,f_auto,c_limit,w_1920,h_1920/${cloudinaryResult.public_id}`;
    
    // Generate preview image URL (~20KB)  
    const previewImageUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/q_auto:eco,f_webp,c_fit,w_400,h_300/${cloudinaryResult.public_id}`;

    console.log('🎨 Generated image variants:', {
      mainImageUrl,
      previewImageUrl,
      publicId: cloudinaryResult.public_id
    });

    // Estimate compressed sizes based on Cloudinary's compression
    const estimatedMainSize = Math.round(cloudinaryResult.bytes * 0.3); // ~400KB
    const estimatedPreviewSize = Math.round(cloudinaryResult.bytes * 0.05); // ~20KB

    const response: UploadResponse = {
      success: true,
      publicId: cloudinaryResult.public_id,
      mainImageUrl,
      previewImageUrl,
      originalSize: cloudinaryResult.bytes,
      compressedSize: estimatedMainSize,
      previewSize: estimatedPreviewSize
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
