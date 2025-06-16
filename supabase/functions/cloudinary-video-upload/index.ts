

import { corsHeaders } from '../_shared/cors.ts'

const CLOUDINARY_CLOUD_NAME = 'dcuziurrb';

interface CloudinaryVideoResponse {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  bytes: number;
  format: string;
  version: number;
  duration?: number;
  resource_type: 'video';
  bit_rate?: number;
  frame_rate?: number;
  video?: {
    pix_format: string;
    codec: string;
    level?: number;
    bit_rate?: number;
  };
  audio?: {
    codec: string;
    bit_rate?: number;
    frequency?: number;
    channels?: number;
  };
}

interface VideoUploadResponse {
  success: boolean;
  publicId?: string;
  cloudinaryUrl?: string;
  thumbnailUrl?: string;
  originalSize?: number;
  compressedSize?: number;
  format?: string;
  duration?: number;
  width?: number;
  height?: number;
  bitRate?: number;
  frameRate?: number;
  error?: string;
}

// Строгие ограничения для видео
const ALLOWED_VIDEO_FORMATS = ['mp4', 'webm', 'mov', 'avi'];
const MAX_VIDEO_SIZE_MB = 20;
const MAX_DURATION_SECONDS = 180; // 3 минуты

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎥 Video upload function started');
    
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY')?.trim();
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')?.trim();
    
    console.log('🔑 Checking Cloudinary credentials:', {
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      apiKeyLength: apiKey?.length || 0
    });
    
    if (!apiKey || !apiSecret) {
      console.error('❌ Missing Cloudinary credentials');
      throw new Error('Cloudinary credentials not configured properly');
    }

    // Handle FormData (same as image function)
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

    console.log('📁 FormData contents:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      productId,
      customPublicId
    });

    if (!file) {
      throw new Error('No video file provided');
    }

    // Strict file validation
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    console.log('🔍 File validation:', {
      fileName: file.name,
      extension: fileExtension,
      allowedFormats: ALLOWED_VIDEO_FORMATS,
      fileType: file.type
    });
    
    if (!fileExtension || !ALLOWED_VIDEO_FORMATS.includes(fileExtension)) {
      throw new Error(`Unsupported video format. Allowed: ${ALLOWED_VIDEO_FORMATS.join(', ')}`);
    }

    // Strict MIME type check
    const allowedMimeTypes = [
      'video/mp4', 
      'video/webm', 
      'video/quicktime', 
      'video/x-msvideo'
    ];
    
    if (!allowedMimeTypes.includes(file.type) && !file.type.startsWith('video/')) {
      throw new Error(`Invalid MIME type: ${file.type}. Expected video file.`);
    }

    // Strict file size check
    const fileSizeMB = file.size / (1024 * 1024);
    console.log('📏 File size check:', {
      sizeBytes: file.size,
      sizeMB: fileSizeMB.toFixed(2),
      maxMB: MAX_VIDEO_SIZE_MB
    });
    
    if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
      throw new Error(`Video file too large. Max size: ${MAX_VIDEO_SIZE_MB}MB, your file: ${fileSizeMB.toFixed(2)}MB`);
    }

    console.log('📹 Starting video upload to Cloudinary:', {
      fileName: file.name,
      sizeKB: Math.round(file.size / 1024),
      format: fileExtension
    });

    // Generate public_id (same as image function)
    const timestamp = Date.now();
    const publicId = customPublicId || `video_${productId || timestamp}_${timestamp}_${Math.random().toString(36).substring(7)}`;
    
    console.log('🏷️ Generated public ID:', publicId);
    
    // Create FormData for Cloudinary (minimal parameters)
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', Math.round(timestamp / 1000).toString());
    cloudinaryFormData.append('public_id', publicId);
    cloudinaryFormData.append('folder', 'videos');
    cloudinaryFormData.append('resource_type', 'video');
    
    // Minimal transformation (or no transformation for testing)
    const transformation = 'q_auto:good,f_auto';
    cloudinaryFormData.append('transformation', transformation);
    
    console.log('🎨 Video transformation:', transformation);

    // EXACT signature generation from image function
    const timestampString = Math.round(timestamp / 1000).toString();
    const stringToSign = `folder=videos&public_id=${publicId}&resource_type=video&timestamp=${timestampString}&transformation=${transformation}${apiSecret}`;
    
    console.log('🔐 Signature generation:', {
      timestampString,
      stringToSignLength: stringToSign.length,
      stringToSignStart: stringToSign.substring(0, 100),
      apiSecretPresent: !!apiSecret
    });
    
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    cloudinaryFormData.append('signature', signature);
    
    console.log('🔏 Generated signature:', {
      signature: signature.substring(0, 10) + '...',
      signatureLength: signature.length
    });

    console.log('☁️ Uploading to Cloudinary video endpoint...');

    // Upload to Cloudinary with retry logic (copied from image function)
    let uploadResponse: Response;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        console.log(`📤 Upload attempt ${retryCount + 1}/${maxRetries + 1}`);
        
        uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
          {
            method: 'POST',
            body: cloudinaryFormData,
          }
        );

        console.log('📥 Cloudinary response status:', uploadResponse.status);

        if (uploadResponse.ok) break;
        
        if (retryCount === maxRetries) {
          const errorText = await uploadResponse.text();
          console.error('❌ Cloudinary video upload failed after all retries:', {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            errorText
          });
          throw new Error(`Cloudinary video upload failed: ${uploadResponse.status} ${errorText}`);
        }
      } catch (error) {
        console.error(`❌ Upload attempt ${retryCount + 1} failed:`, error);
        if (retryCount === maxRetries) {
          throw error;
        }
      }
      
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
    }

    const cloudinaryResult: CloudinaryVideoResponse = await uploadResponse!.json();
    
    console.log('✅ Video successfully uploaded:', {
      publicId: cloudinaryResult.public_id,
      secureUrl: cloudinaryResult.secure_url,
      duration: cloudinaryResult.duration,
      format: cloudinaryResult.format,
      sizeKB: Math.round(cloudinaryResult.bytes / 1024),
      width: cloudinaryResult.width,
      height: cloudinaryResult.height
    });

    // Check video duration
    if (cloudinaryResult.duration && cloudinaryResult.duration > MAX_DURATION_SECONDS) {
      console.warn('⚠️ Video exceeds recommended duration:', {
        duration: cloudinaryResult.duration,
        maxDuration: MAX_DURATION_SECONDS
      });
      // Don't block upload, just warn
    }

    // Generate URLs (simple, no complex transformations)
    const optimizedVideoUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/${transformation}/${cloudinaryResult.public_id}`;
    const thumbnailUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/f_jpg,w_300,h_200,c_fill,q_auto:good/${cloudinaryResult.public_id}.jpg`;

    console.log('🖼️ Generated URLs:', {
      optimizedVideoUrl,
      thumbnailUrl
    });

    const response: VideoUploadResponse = {
      success: true,
      publicId: cloudinaryResult.public_id,
      cloudinaryUrl: optimizedVideoUrl,
      thumbnailUrl,
      originalSize: cloudinaryResult.bytes,
      compressedSize: Math.round(cloudinaryResult.bytes * 0.8), // Estimate
      format: cloudinaryResult.format,
      duration: cloudinaryResult.duration,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height,
      bitRate: cloudinaryResult.bit_rate,
      frameRate: cloudinaryResult.frame_rate
    };

    console.log('🎉 Returning successful response');

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('💥 Video upload error:', error);
    
    const errorResponse: VideoUploadResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown video upload error'
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

