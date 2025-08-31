
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Authentication utilities
async function verifyAdminAccess(supabaseClient: any, authHeader: string) {
  console.log('=== ADMIN VERIFICATION START ===');
  
  if (!authHeader) {
    console.error('No authorization header provided');
    throw new Error('Missing authorization header');
  }

  const token = authHeader.replace('Bearer ', '').trim();
  console.log('Token extracted, length:', token.length);
  
  if (!token || token.length < 20) {
    console.error('Invalid token format or length');
    throw new Error('Invalid token format');
  }

  const supabaseWithAuth = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    }
  );

  const { data: { user }, error: authError } = await supabaseWithAuth.auth.getUser(token);

  if (authError || !user) {
    console.error('Authentication failed:', authError?.message || 'No user found');
    throw new Error(`Authentication failed: ${authError?.message || 'Invalid or expired token'}`);
  }

  console.log('User authenticated:', user.id);

  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching user profile:', profileError.message);
    throw new Error(`Failed to verify user permissions: ${profileError.message}`);
  }

  if (!profile || profile.user_type !== 'admin') {
    console.error('Admin access denied for user:', user.id, 'type:', profile?.user_type);
    throw new Error('Admin access required');
  }

  console.log('Admin permissions verified for user:', user.id);
  console.log('=== ADMIN VERIFICATION SUCCESS ===');
  
  return user;
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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client for auth verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? "",
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    );

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    await verifyAdminAccess(supabaseClient, authHeader || '');

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
