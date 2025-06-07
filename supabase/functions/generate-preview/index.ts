
import { corsHeaders } from '../_shared/cors.ts'

const CLOUDINARY_CLOUD_NAME = 'dcuziurrb';

interface GeneratePreviewRequest {
  publicId: string;
  targetSize?: number; // Target size in KB, default 30
}

interface GeneratePreviewResponse {
  success: boolean;
  previewUrl?: string;
  originalPublicId?: string;
  estimatedSize?: number;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🖼️ Starting preview image generation...');

    const { publicId, targetSize = 30 } = await req.json() as GeneratePreviewRequest;

    if (!publicId) {
      throw new Error('No publicId provided');
    }

    console.log('📤 Generating preview for:', {
      publicId,
      targetSize: `${targetSize}KB`
    });

    // Clean publicId from version prefix if present
    const cleanPublicId = publicId.replace(/^v\d+\//, '');

    // Generate optimized preview URL for catalog display (~30KB)
    // Using aggressive compression and WebP format
    const previewUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_400,h_300,c_fit,g_auto,q_auto:eco,f_webp,fl_progressive:semi/${cleanPublicId}`;

    console.log('✅ Generated preview URL:', {
      originalPublicId: publicId,
      cleanPublicId,
      previewUrl,
      estimatedSize: `~${targetSize}KB`
    });

    const response: GeneratePreviewResponse = {
      success: true,
      previewUrl,
      originalPublicId: publicId,
      estimatedSize: targetSize
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('💥 Preview generation error:', error);
    
    const errorResponse: GeneratePreviewResponse = {
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
