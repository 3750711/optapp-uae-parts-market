
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

const ALLOWED_VIDEO_FORMATS = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', '3gp'];
const MAX_VIDEO_SIZE_MB = 100;
const MAX_DURATION_SECONDS = 300; // 5 minutes

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

    // Only handle FormData path - remove JSON/base64 support
    console.log('📋 Processing FormData request');
    const formData = await req.formData();
    
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;
    const customPublicId = formData.get('customPublicId') as string;
    
    console.log('📁 FormData contents:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      productId,
      customPublicId
    });

    if (!file) {
      throw new Error('No video file provided in FormData');
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    console.log('🔍 File validation:', {
      fileName: file.name,
      extension: fileExtension,
      allowedFormats: ALLOWED_VIDEO_FORMATS
    });
    
    if (!fileExtension || !ALLOWED_VIDEO_FORMATS.includes(fileExtension)) {
      throw new Error(`Unsupported video format. Allowed formats: ${ALLOWED_VIDEO_FORMATS.join(', ')}`);
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    console.log('📏 File size check:', {
      sizeBytes: file.size,
      sizeMB: fileSizeMB.toFixed(2),
      maxMB: MAX_VIDEO_SIZE_MB
    });
    
    if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
      throw new Error(`Video file too large. Maximum size: ${MAX_VIDEO_SIZE_MB}MB`);
    }

    console.log('📹 Starting video upload to Cloudinary:', {
      fileName: file.name,
      sizeKB: Math.round(file.size / 1024),
      format: fileExtension
    });

    // Generate optimized public_id for video
    const timestamp = Date.now();
    const publicId = customPublicId || `video_${productId || timestamp}_${timestamp}_${Math.random().toString(36).substring(7)}`;
    
    console.log('🏷️ Generated public ID:', publicId);
    
    // Create optimized FormData for Cloudinary video upload
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', Math.round(timestamp / 1000).toString());
    cloudinaryFormData.append('public_id', publicId);
    cloudinaryFormData.append('folder', 'videos');
    cloudinaryFormData.append('resource_type', 'video');
    
    // Video-specific optimizations based on file size
    let videoTransformation: string;
    if (fileSizeMB > 50) {
      // Heavy compression for large files
      videoTransformation = 'q_auto:low,f_auto,c_limit,w_854,h_480,br_500k,fps_24';
    } else if (fileSizeMB > 20) {
      // Medium compression
      videoTransformation = 'q_auto:good,f_auto,c_limit,w_1280,h_720,br_1000k,fps_30';
    } else {
      // Light compression for smaller files
      videoTransformation = 'q_auto:good,f_auto,c_limit,w_1920,h_1080,br_2000k';
    }
    
    console.log('🎨 Video transformation:', videoTransformation);
    cloudinaryFormData.append('transformation', videoTransformation);
    
    // Generate thumbnail
    const eagerTransformation = 'f_jpg,w_300,h_200,c_fill,q_auto:good';
    cloudinaryFormData.append('eager', eagerTransformation);

    // Generate signature for video upload - FIXED signature generation
    const timestampString = Math.round(timestamp / 1000).toString();
    const signatureParams = [
      `eager=${eagerTransformation}`,
      `folder=videos`,
      `public_id=${publicId}`,
      `resource_type=video`,
      `timestamp=${timestampString}`,
      `transformation=${videoTransformation}`
    ].sort().join('&');
    
    const stringToSign = `${signatureParams}${apiSecret}`;
    
    console.log('🔐 Signature generation:', {
      timestampString,
      signatureParams,
      stringToSignLength: stringToSign.length
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

    // Upload to Cloudinary video endpoint with retry logic
    let uploadResponse: Response;
    let retryCount = 0;
    const maxRetries = 2;

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

        if (uploadResponse.ok) {
          console.log('✅ Upload successful on attempt', retryCount + 1);
          break;
        }
        
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
        console.log(`🔄 Retrying upload (attempt ${retryCount + 1}/${maxRetries + 1})`);
      }
      
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
    }

    const cloudinaryResult: CloudinaryVideoResponse = await uploadResponse!.json();
    
    console.log('✅ Video upload successful:', {
      publicId: cloudinaryResult.public_id,
      secureUrl: cloudinaryResult.secure_url,
      duration: cloudinaryResult.duration,
      format: cloudinaryResult.format,
      sizeKB: Math.round(cloudinaryResult.bytes / 1024),
      width: cloudinaryResult.width,
      height: cloudinaryResult.height
    });

    // Validate video duration if available
    if (cloudinaryResult.duration && cloudinaryResult.duration > MAX_DURATION_SECONDS) {
      console.warn('⚠️ Video duration exceeds recommended limit:', {
        duration: cloudinaryResult.duration,
        maxDuration: MAX_DURATION_SECONDS
      });
    }

    // Generate optimized video URL and thumbnail URL
    const optimizedVideoUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/${videoTransformation}/${cloudinaryResult.public_id}`;
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
      compressedSize: Math.round(cloudinaryResult.bytes * 0.6), // Estimated compression
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
      error: error instanceof Error ? error.message : 'Unknown error occurred during video upload'
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
