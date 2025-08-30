
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
  duration?: number;
  resource_type: 'image' | 'video';
}

interface UploadResponse {
  success: boolean;
  publicId?: string;
  mainImageUrl?: string;
  originalSize?: number;
  compressedSize?: number;
  format?: string;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY')?.trim();
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')?.trim();
    const uploadPreset = Deno.env.get('CLOUDINARY_UPLOAD_PRESET')?.trim();
    
    if (!apiKey || !apiSecret || !uploadPreset) {
      console.error('❌ Missing Cloudinary credentials');
      throw new Error('Cloudinary credentials not configured properly');
    }

    // Handle FormData (optimized path) or JSON (fallback)
    let file: File | null = null;
    let productId: string | undefined;
    let customPublicId: string | undefined;

    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Optimized FormData path
      const formData = await req.formData();
      file = formData.get('file') as File;
      productId = formData.get('productId') as string;
      customPublicId = formData.get('customPublicId') as string;
    } else {
      // Fallback JSON path (base64)
      const { fileData, fileName, productId: pid, customPublicId: cpid } = await req.json();
      if (fileData && fileName) {
        const base64Data = fileData.startsWith('data:') 
          ? fileData.split(',')[1] 
          : fileData;
        const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        file = new File([bytes], fileName);
        productId = pid;
        customPublicId = cpid;
      }
    }

    if (!file) {
      throw new Error('No file provided');
    }

    // Generate optimized public_id
    const timestamp = Date.now();
    const publicId = customPublicId || `product_${productId || timestamp}_${timestamp}_${Math.random().toString(36).substring(7)}`;
    
    // Check if file is HEIC/HEIF
    const isHeicFile = file.type.includes('heic') || file.type.includes('heif') || 
                      file.name.toLowerCase().includes('.heic') || file.name.toLowerCase().includes('.heif');
    
    // Create optimized FormData for Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', Math.round(timestamp / 1000).toString());
    cloudinaryFormData.append('public_id', publicId);
    cloudinaryFormData.append('folder', 'products');
    
    // Special transformation for HEIC files to ensure conversion to JPEG
    const transformation = isHeicFile 
      ? 'f_jpg,q_auto:good,c_limit,w_1600,angle_auto_right' 
      : 'q_auto:good,f_auto,c_limit,w_1200,h_1200,angle_auto_right';
    cloudinaryFormData.append('transformation', transformation);

    // Generate signature
    const stringToSign = `folder=products&public_id=${publicId}&timestamp=${Math.round(timestamp / 1000)}&transformation=${transformation}${apiSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    cloudinaryFormData.append('signature', signature);

    // Upload to Cloudinary with retry logic
    let uploadResponse: Response;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: cloudinaryFormData,
          }
        );

        if (uploadResponse.ok) break;
        
        if (retryCount === maxRetries) {
          const errorText = await uploadResponse.text();
          throw new Error(`Cloudinary upload failed: ${uploadResponse.status} ${errorText}`);
        }
      } catch (error) {
        if (retryCount === maxRetries) {
          throw error;
        }
      }
      
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
    }

    const cloudinaryResult: CloudinaryResponse = await uploadResponse!.json();
    
    // Generate optimized main image URL with proper transformation
    const mainImageUrl = isHeicFile
      ? `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_jpg,q_auto:good,c_limit,w_1600,angle_auto_right/${cloudinaryResult.public_id}`
      : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/q_auto:good,f_auto,c_limit,w_1200,h_1200,angle_auto_right/${cloudinaryResult.public_id}`;
    const estimatedCompressedSize = Math.round(cloudinaryResult.bytes * 0.4);

    const response: UploadResponse = {
      success: true,
      publicId: cloudinaryResult.public_id,
      mainImageUrl,
      originalSize: cloudinaryResult.bytes,
      compressedSize: estimatedCompressedSize,
      format: cloudinaryResult.format
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
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
