
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
  // Handle CORS preflight requests  
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    console.log(`📥 Incoming request: ${req.method}, Content-Type: ${req.headers.get('content-type') || 'none'}`);
    
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY')?.trim();
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')?.trim();
    const uploadPreset = Deno.env.get('CLOUDINARY_UPLOAD_PRESET')?.trim();
    
    if (!apiKey || !apiSecret || !uploadPreset) {
      console.error('❌ Missing Cloudinary credentials');
      return jsonResponse({
        success: false,
        error: 'Cloudinary credentials not configured properly'
      }, 500);
    }

    // Handle FormData (optimized path) or JSON (fallback)
    let file: File | null = null;
    let productId: string | undefined;
    let customPublicId: string | undefined;

    const contentType = req.headers.get('content-type') || '';
    console.log(`📋 Processing content type: ${contentType}`);
    
    if (contentType.includes('multipart/form-data')) {
      // Optimized FormData path
      console.log('📁 Processing FormData upload...');
      try {
        const formData = await req.formData();
        file = formData.get('file') as File;
        productId = formData.get('productId') as string;
        customPublicId = formData.get('customPublicId') as string;
        console.log(`📁 FormData processed: file=${!!file}, productId=${productId}, customPublicId=${customPublicId}`);
      } catch (error) {
        console.error('❌ Error processing FormData:', error);
        return jsonResponse({
          success: false,
          error: 'Failed to process FormData upload'
        }, 400);
      }
    } else {
      // Fallback JSON path (base64)
      console.log('📄 Processing JSON upload...');
      try {
        const requestData = await req.json();
        console.log(`📄 JSON data received: fileData=${!!requestData.fileData}, fileName=${requestData.fileName}`);
        
        const { fileData, fileName, productId: pid, customPublicId: cpid } = requestData;
        if (fileData && fileName) {
          const base64Data = fileData.startsWith('data:') 
            ? fileData.split(',')[1] 
            : fileData;
          const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          file = new File([bytes], fileName);
          productId = pid;
          customPublicId = cpid;
          console.log(`📄 JSON processed: file size=${file.size}, name=${file.name}`);
        }
      } catch (error) {
        console.error('❌ Error processing JSON:', error);
        return jsonResponse({
          success: false,
          error: 'Invalid JSON in request body'
        }, 400);
      }
    }

    if (!file) {
      console.error('❌ No file provided in request');
      return jsonResponse({
        success: false,
        error: 'No file provided'
      }, 400);
    }

    console.log(`📸 Processing image: ${file.name} (${file.type}), size: ${Math.round(file.size / 1024)}KB`);

    // Generate optimized public_id
    const timestamp = Date.now();
    const publicId = customPublicId || `product_${productId || timestamp}_${timestamp}_${Math.random().toString(36).substring(7)}`;
    
    // Create optimized FormData for Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', Math.round(timestamp / 1000).toString());
    cloudinaryFormData.append('public_id', publicId);
    cloudinaryFormData.append('folder', 'products');
    
    // Unified transformation for all image formats - convert everything to WebP
    const transformation = 'f_webp,q_auto:good,c_limit,w_1200';
    cloudinaryFormData.append('transformation', transformation);
    
    console.log(`🎯 Applying unified WebP transformation: ${transformation}`);

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
          console.error(`❌ Cloudinary upload failed after ${maxRetries} retries: ${uploadResponse.status} ${errorText}`);
          return jsonResponse({
            success: false,
            error: `Cloudinary upload failed: ${uploadResponse.status}`,
            cloudinary_error: errorText.substring(0, 500) // Limit error message length
          }, 500);
        }
      } catch (error) {
        if (retryCount === maxRetries) {
          console.error(`❌ Cloudinary upload exception after ${maxRetries} retries:`, error);
          return jsonResponse({
            success: false,
            error: `Upload failed: ${error instanceof Error ? error.message : 'Network error'}`
          }, 500);
        }
      }
      
      retryCount++;
      console.log(`🔄 Retrying upload (attempt ${retryCount + 1}/${maxRetries + 1})...`);
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
    }

    // Safely parse Cloudinary response with content-type checking
    const responseContentType = uploadResponse!.headers.get('content-type') || '';
    console.log(`📥 Cloudinary response: status=${uploadResponse!.status}, content-type=${responseContentType}`);
    
    let cloudinaryResult: CloudinaryResponse;
    try {
      if (!responseContentType.includes('application/json')) {
        const responseText = await uploadResponse!.text();
        console.error(`❌ Cloudinary returned non-JSON response: ${responseText.substring(0, 500)}`);
        return jsonResponse({
          success: false,
          error: 'Cloudinary returned invalid response format',
          cloudinary_error: responseText.substring(0, 500)
        }, 500);
      }
      
      cloudinaryResult = await uploadResponse!.json();
      console.log(`✅ Cloudinary JSON parsed successfully: public_id=${cloudinaryResult.public_id}`);
    } catch (error) {
      console.error(`❌ Failed to parse Cloudinary JSON response:`, error);
      const responseText = await uploadResponse!.text().catch(() => 'Unable to read response text');
      return jsonResponse({
        success: false,
        error: 'Failed to parse Cloudinary response',
        cloudinary_error: responseText.substring(0, 500)
      }, 500);
    }
    
    // Clean the public_id by removing version prefix and file extension
    const cleanPublicId = cloudinaryResult.public_id
      .replace(/^v\d+\//, '') // Remove version prefix like v1234567890/
      .replace(/\.[^/.]+$/, ''); // Remove file extension like .heic, .jpg, etc.
    
    console.log(`🧹 Cleaned public_id: "${cloudinaryResult.public_id}" → "${cleanPublicId}"`);
    
    // Generate unified main image URL - all formats converted to WebP with transformations
    const mainImageUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_webp,q_auto:good,c_limit,w_1200/${cleanPublicId}`;
    
    const estimatedCompressedSize = Math.round(cloudinaryResult.bytes * 0.35); // WebP compression estimate
    
    console.log(`✅ Image processed successfully: ${file.name}`);
    console.log(`📊 Original: ${Math.round(file.size / 1024)}KB → Compressed: ~${Math.round(estimatedCompressedSize / 1024)}KB`);
    console.log(`🌐 WebP URL: ${mainImageUrl}`);
    
    // Log the file format conversion for HEIC debugging
    if (file.name.toLowerCase().includes('.heic') || file.type.includes('heic')) {
      console.log(`📱 HEIC conversion: ${file.name} (${file.type}) → WebP format`);
    }

    const response: UploadResponse = {
      success: true,
      publicId: cleanPublicId, // Return the cleaned public_id
      mainImageUrl,
      originalSize: cloudinaryResult.bytes,
      compressedSize: estimatedCompressedSize,
      format: 'webp' // Always WebP after processing
    };

    console.log(`✅ Upload successful, returning response: publicId=${cleanPublicId}, mainImageUrl=${mainImageUrl}`);
    return jsonResponse(response, 200);

  } catch (error) {
    console.error('❌ Unexpected error in cloudinary-upload:', error);
    const errorResponse: UploadResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };

    return jsonResponse(errorResponse, 500);
  }
});
