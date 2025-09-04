import { handleWithCors } from "../_shared/handler.ts";
import { BadRequestError, UnsupportedMediaType, PayloadTooLarge, UpstreamError } from "../_shared/errors.ts";

const CLOUDINARY_CLOUD_NAME = 'dcuziurrb';
const MAX_SIZE_MB = 25;

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
  reqId: string;
}

Deno.serve(handleWithCors(async (req, { reqId, cors }) => {
  if (req.method !== "POST") {
    throw new BadRequestError("method_not_allowed", "POST method required");
  }

  const apiKey = Deno.env.get('CLOUDINARY_API_KEY')?.trim();
  const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')?.trim();
  const uploadPreset = Deno.env.get('CLOUDINARY_UPLOAD_PRESET')?.trim();
  
  if (!apiKey || !apiSecret || !uploadPreset) {
    console.error('❌ Missing Cloudinary credentials');
    throw new UpstreamError("cloudinary_config_missing", "Cloudinary credentials not configured");
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
  } else if (contentType.includes('application/json')) {
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
  } else {
    throw new UnsupportedMediaType("unsupported_content_type", "Use multipart/form-data or application/json");
  }

  if (!file) {
    throw new BadRequestError("file_missing", "No file provided in request");
  }

  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > MAX_SIZE_MB) {
    throw new PayloadTooLarge("file_too_large", `File size ${sizeMb.toFixed(1)}MB exceeds ${MAX_SIZE_MB}MB limit`);
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
  if (!allowedTypes.includes(file.type.toLowerCase()) && !file.name.toLowerCase().endsWith('.heic')) {
    throw new UnsupportedMediaType("unsupported_file_type", `File type ${file.type} not supported`);
  }

  console.log(`📸 Processing image: ${file.name} (${file.type}), size: ${Math.round(file.size / 1024)}KB, reqId: ${reqId}`);

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
        throw new UpstreamError("cloudinary_upload_failed", `Cloudinary upload failed: ${uploadResponse.status} ${errorText.slice(0, 500)}`);
      }
    } catch (error) {
      if (retryCount === maxRetries) {
        if (error instanceof UpstreamError) throw error;
        throw new UpstreamError("cloudinary_network_error", `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    retryCount++;
    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
  }

  const cloudinaryResult: CloudinaryResponse = await uploadResponse!.json();
  
  // Clean the public_id by removing version prefix and file extension
  const cleanPublicId = cloudinaryResult.public_id
    .replace(/^v\d+\//, '') // Remove version prefix like v1234567890/
    .replace(/\.[^/.]+$/, ''); // Remove file extension like .heic, .jpg, etc.
  
  console.log(`🧹 Cleaned public_id: "${cloudinaryResult.public_id}" → "${cleanPublicId}"`);
  
  // Generate unified main image URL - all formats converted to WebP with transformations
  const mainImageUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_webp,q_auto:good,c_limit,w_1200/${cleanPublicId}`;
  
  const estimatedCompressedSize = Math.round(cloudinaryResult.bytes * 0.35); // WebP compression estimate
  
  console.log(`✅ Image processed successfully: ${file.name}, reqId: ${reqId}`);
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
    format: 'webp', // Always WebP after processing
    reqId
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}));