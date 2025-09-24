
// CORS headers with updated allowlist
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
}

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
  // Generate unique request ID for logging
  const rid = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // Handle CORS preflight requests  
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  // Get JWT token from Authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    console.error(`❌ [${rid}] Unauthorized - missing JWT token`);
    return jsonResponse({
      success: false,
      error: 'Unauthorized - missing JWT token'
    }, 401);
  }

  try {
    const contentType = req.headers.get('content-type') || 'none';
    console.log(`📥 [${rid}] Incoming request: ${req.method}, Content-Type: ${contentType}`);
    
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

    // Handle both input formats and extract all data in one read
    let file: File | null = null;
    let folder = 'products'; // default folder
    let orderId: string | null = null;
    let requestData: any = null;
    let formData: FormData | null = null;
    
    // Single read of request body based on content type
    if (contentType.includes('multipart/form-data')) {
      // multipart/form-data: extract file, folder, and order_id in one read
      console.log(`📁 [${rid}] Processing FormData upload...`);
      try {
        formData = await req.formData();
        file = formData.get('file') as File;
        const folderParam = formData.get('folder') as string;
        if (folderParam) folder = folderParam;
        orderId = formData.get('order_id') as string;
        
        console.log(`📁 [${rid}] FormData processed: file=${!!file}, name=${file?.name}, type=${file?.type}, size=${file?.size}, folder=${folder}, order_id=${orderId}`);
      } catch (error) {
        console.error(`❌ [${rid}] Error processing FormData:`, error);
        return jsonResponse({
          success: false,
          error: 'Failed to process FormData upload'
        }, 400);
      }
    } else {
      // application/json: extract base64, name, type, folder, and order_id in one read
      console.log(`📄 [${rid}] Processing JSON upload...`);
      try {
        requestData = await req.json();
        console.log(`📄 [${rid}] JSON data received: base64=${!!requestData.base64}, name=${requestData.name}, type=${requestData.type}, folder=${requestData.folder}, order_id=${requestData.order_id}`);
        
        const { base64, name, type, folder: folderParam, order_id } = requestData;
        orderId = order_id;
        if (base64 && name && type) {
          const base64Data = base64.startsWith('data:') 
            ? base64.split(',')[1] 
            : base64;
          const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          file = new File([bytes], name, { type });
          if (folderParam) folder = folderParam;
          console.log(`📄 [${rid}] JSON processed: file size=${file.size}, name=${file.name}, type=${file.type}, folder=${folder}`);
        }
      } catch (error) {
        console.error(`❌ [${rid}] Error processing JSON:`, error);
        return jsonResponse({
          success: false,
          error: 'Invalid JSON in request body'
        }, 400);
      }
    }

    // Backend protection: Check for photo limit if order_id is provided
    if (orderId && authHeader) {
      try {
        const { createServiceClient } = await import('../_shared/client.ts');
        const adminClient = createServiceClient();
        
        const { data: orderData, error: orderError } = await adminClient
          .from('orders')
          .select('images')
          .eq('id', orderId)
          .single();

        if (orderError) {
          console.error(`❌ [${rid}] Error checking order photos:`, orderError);
        } else if (orderData && Array.isArray(orderData.images)) {
          const currentPhotoCount = orderData.images.length;
          console.log(`📊ሱ[${rid}] Current photo count for order ${orderId}: ${currentPhotoCount}`);
          
          if (currentPhotoCount >= 50) {
            console.error(`❌ [${rid}] Photo limit exceeded: ${currentPhotoCount}/50`);
            return jsonResponse({
              success: false,
              error: `Photo limit exceeded. Maximum 50 photos allowed per order. Current count: ${currentPhotoCount}`,
              currentCount: currentPhotoCount,
              maxCount: 50
            }, 400);
          }
        }
      } catch (limitError) {
        console.error(`❌ [${rid}] Error during photo limit check:`, limitError);
        // Continue with upload even if limit check fails
      }
    }

    if (!file) {
      console.error(`❌ [${rid}] No file provided in request`);
      return jsonResponse({
        success: false,
        error: 'No file provided'
      }, 400);
    }

    console.log(`📸 [${rid}] Processing file: ${file.name} (${file.type}), size: ${Math.round(file.size / 1024)}KB, folder: ${folder}`);

    // Generate optimized public_id
    const timestamp = Date.now();
    const publicId = `${folder}/upload_${timestamp}_${Math.random().toString(36).substring(7)}`;
    
    // Create optimized FormData for Cloudinary with resource_type=auto
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', Math.round(timestamp / 1000).toString());
    cloudinaryFormData.append('public_id', publicId);
    cloudinaryFormData.append('folder', folder);
    
    // Unified transformation for all media formats - convert to WebP for images
    const transformation = 'f_webp,q_auto:good,c_limit,w_1200';
    cloudinaryFormData.append('transformation', transformation);
    
    console.log(`🎯 [${rid}] Applying unified WebP transformation: ${transformation}`);

    // Generate signature
    const stringToSign = `folder=${folder}&public_id=${publicId}&timestamp=${Math.round(timestamp / 1000)}&transformation=${transformation}${apiSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    cloudinaryFormData.append('signature', signature);

    // Upload to Cloudinary with resource_type=auto and retry logic
    let uploadResponse: Response;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        // Use resource_type=auto endpoint for all media types
        uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
          {
            method: 'POST',
            body: cloudinaryFormData,
          }
        );

        if (uploadResponse.ok) break;
        
        if (retryCount === maxRetries) {
          const errorText = await uploadResponse.text();
          console.error(`❌ [${rid}] Cloudinary upload failed after ${maxRetries} retries: ${uploadResponse.status} ${errorText}`);
          return jsonResponse({
            success: false,
            error: "cloudinary_error",
            status: uploadResponse.status,
            body: errorText.substring(0, 500)
          }, 500);
        }
      } catch (error) {
        if (retryCount === maxRetries) {
          console.error(`❌ [${rid}] Cloudinary upload exception after ${maxRetries} retries:`, error);
          return jsonResponse({
            success: false,
            error: `Upload failed: ${error instanceof Error ? error.message : 'Network error'}`
          }, 500);
        }
      }
      
      retryCount++;
      console.log(`🔄 [${rid}] Retrying upload (attempt ${retryCount + 1}/${maxRetries + 1})...`);
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
    }

    // Safely parse Cloudinary response with content-type checking
    const responseContentType = uploadResponse!.headers.get('content-type') || '';
    console.log(`📥 [${rid}] Cloudinary response: status=${uploadResponse!.status}, content-type=${responseContentType}`);
    
    let cloudinaryResult: CloudinaryResponse;
    try {
      if (!responseContentType.includes('application/json')) {
        const responseText = await uploadResponse!.text();
        console.error(`❌ [${rid}] Cloudinary returned non-JSON response: ${responseText.substring(0, 500)}`);
        return jsonResponse({
          success: false,
          error: "cloudinary_error",
          status: uploadResponse!.status,
          body: responseText.substring(0, 500)
        }, 500);
      }
      
      cloudinaryResult = await uploadResponse!.json();
      console.log(`✅ [${rid}] Cloudinary JSON parsed successfully: public_id=${cloudinaryResult.public_id}`);
    } catch (error) {
      console.error(`❌ [${rid}] Failed to parse Cloudinary JSON response:`, error);
      const responseText = await uploadResponse!.text().catch(() => 'Unable to read response text');
      return jsonResponse({
        success: false,
        error: "cloudinary_error",
        status: uploadResponse!.status,
        body: responseText.substring(0, 500)
      }, 500);
    }
    
    // Clean the public_id by removing version prefix and file extension
    const cleanPublicId = cloudinaryResult.public_id
      .replace(/^v\d+\//, '') // Remove version prefix like v1234567890/
      .replace(/\.[^/.]+$/, ''); // Remove file extension like .heic, .jpg, etc.
    
    console.log(`🧹 [${rid}] Cleaned public_id: "${cloudinaryResult.public_id}" → "${cleanPublicId}"`);
    
    // Generate unified main image URL - all formats converted to WebP with transformations
    const mainImageUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_webp,q_auto:good,c_limit,w_1200/${cleanPublicId}`;
    
    const estimatedCompressedSize = Math.round(cloudinaryResult.bytes * 0.35); // WebP compression estimate
    
    console.log(`✅ [${rid}] File processed successfully: ${file.name}`);
    console.log(`📊 [${rid}] Original: ${Math.round(file.size / 1024)}KB → Compressed: ~${Math.round(estimatedCompressedSize / 1024)}KB`);
    console.log(`🌐 [${rid}] WebP URL: ${mainImageUrl}`);
    
    // Log the file format conversion for HEIC debugging
    if (file.name.toLowerCase().includes('.heic') || file.type.includes('heic')) {
      console.log(`📱 [${rid}] HEIC conversion: ${file.name} (${file.type}) → WebP format`);
    }

    const response: UploadResponse = {
      success: true,
      publicId: cleanPublicId, // Return the cleaned public_id
      mainImageUrl,
      originalSize: cloudinaryResult.bytes,
      compressedSize: estimatedCompressedSize,
      format: 'webp' // Always WebP after processing
    };

    console.log(`✅ [${rid}] Upload successful, returning response: publicId=${cleanPublicId}, mainImageUrl=${mainImageUrl}`);
    return jsonResponse(response, 200);

  } catch (error) {
    console.error(`❌ [${rid}] Unexpected error in cloudinary-upload:`, error);
    const errorResponse: UploadResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };

    return jsonResponse(errorResponse, 500);
  }
});
