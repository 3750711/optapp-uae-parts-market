
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
const MAX_VIDEO_SIZE_MB = 50;
const MAX_DURATION_SECONDS = 180;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY')?.trim();
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')?.trim();
    
    console.log('🔑 API Key exists:', !!apiKey);
    console.log('🔐 API Secret exists:', !!apiSecret);
    
    if (!apiKey || !apiSecret) {
      console.error('❌ Missing Cloudinary credentials');
      throw new Error('Cloudinary credentials not configured properly');
    }

    // Only handle FormData like photo upload - no more base64/JSON
    const contentType = req.headers.get('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      throw new Error('Video upload requires FormData (multipart/form-data)');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;
    const customPublicId = formData.get('customPublicId') as string;

    if (!file) {
      throw new Error('No video file provided');
    }

    console.log('📹 Processing video file:', {
      fileName: file.name,
      sizeKB: Math.round(file.size / 1024),
      type: file.type
    });

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !ALLOWED_VIDEO_FORMATS.includes(fileExtension)) {
      throw new Error(`Unsupported video format. Allowed formats: ${ALLOWED_VIDEO_FORMATS.join(', ')}`);
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
      throw new Error(`Video file too large. Maximum size: ${MAX_VIDEO_SIZE_MB}MB`);
    }

    console.log('📹 Starting video upload:', {
      fileName: file.name,
      sizeKB: Math.round(file.size / 1024),
      format: fileExtension
    });

    const timestamp = Math.round(Date.now() / 1000);
    const publicId = customPublicId || `video_${productId || timestamp}_${timestamp}`;
    
    // Dynamic video transformation based on size
    let videoTransformation: string;
    if (fileSizeMB > 30) {
      videoTransformation = 'q_auto:low,w_720,h_480';
    } else if (fileSizeMB > 10) {
      videoTransformation = 'q_auto:good,w_1280,h_720';
    } else {
      videoTransformation = 'q_auto:good,w_1920,h_1080';
    }
    
    const eagerTransform = 'w_300,h_200,c_fill,q_auto:good,f_jpg';
    
    // ПРАВИЛЬНЫЕ параметры для подписи видео
    const signatureParams = {
      eager: eagerTransform,
      folder: 'videos',
      public_id: publicId,
      resource_type: 'video',
      timestamp: timestamp.toString(),
      transformation: videoTransformation
    };

    console.log('📝 Signature parameters:', signatureParams);

    // Генерация подписи с правильной сортировкой
    const sortedParams = Object.keys(signatureParams)
      .sort()
      .map(key => `${key}=${signatureParams[key as keyof typeof signatureParams]}`)
      .join('&');
    
    const stringToSign = sortedParams + apiSecret;
    
    console.log('🔏 String to sign:', stringToSign);
    
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('✍️ Generated signature:', signature);

    // Создаем FormData для Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', timestamp.toString());
    cloudinaryFormData.append('public_id', publicId);
    cloudinaryFormData.append('folder', 'videos');
    cloudinaryFormData.append('resource_type', 'video');
    cloudinaryFormData.append('transformation', videoTransformation);
    cloudinaryFormData.append('eager', eagerTransform);
    cloudinaryFormData.append('signature', signature);

    console.log('☁️ Uploading to Cloudinary video endpoint...');

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Cloudinary video upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: errorText
      });
      throw new Error(`Cloudinary video upload failed: ${uploadResponse.status} ${errorText}`);
    }

    const cloudinaryResult: CloudinaryVideoResponse = await uploadResponse.json();
    
    console.log('✅ Video upload successful:', {
      publicId: cloudinaryResult.public_id,
      duration: cloudinaryResult.duration,
      format: cloudinaryResult.format,
      sizeKB: Math.round(cloudinaryResult.bytes / 1024),
      width: cloudinaryResult.width,
      height: cloudinaryResult.height
    });

    if (cloudinaryResult.duration && cloudinaryResult.duration > MAX_DURATION_SECONDS) {
      console.warn('⚠️ Video duration exceeds recommended limit:', cloudinaryResult.duration);
    }

    // Generate URLs
    const optimizedVideoUrl = cloudinaryResult.secure_url;
    const thumbnailUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/${eagerTransform}/${cloudinaryResult.public_id}.jpg`;

    const response: VideoUploadResponse = {
      success: true,
      publicId: cloudinaryResult.public_id,
      cloudinaryUrl: optimizedVideoUrl,
      thumbnailUrl,
      originalSize: cloudinaryResult.bytes,
      compressedSize: Math.round(cloudinaryResult.bytes * 0.8),
      format: cloudinaryResult.format,
      duration: cloudinaryResult.duration,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height,
      bitRate: cloudinaryResult.bit_rate,
      frameRate: cloudinaryResult.frame_rate
    };

    console.log('🎉 Video upload completed successfully:', {
      cloudinaryUrl: response.cloudinaryUrl,
      thumbnailUrl: response.thumbnailUrl,
      duration: response.duration
    });

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
