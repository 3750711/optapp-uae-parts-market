import { supabase } from "@/integrations/supabase/client";

interface CloudinarySignature {
  api_key: string;
  timestamp: number;
  signature: string;
  upload_url: string;
  cloud_name: string;
  public_id: string;
  folder: string;
}

// Convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export const uploadViaEdgeFunction = async (
  file: File,
  signature: CloudinarySignature,
  onProgress: (progress: number) => void
): Promise<{ url: string; publicId: string }> => {
  try {
    console.log('📤 HEIC: Using Edge Function upload for converted file:', {
      fileName: file.name,
      fileSize: file.size,
      publicId: signature.public_id
    });

    // Convert file to base64
    const fileData = await fileToBase64(file);
    onProgress(10); // Show some initial progress

    console.log('☁️ HEIC: Calling cloudinary-upload Edge Function...');
    
    const { data, error } = await supabase.functions.invoke('cloudinary-upload', {
      body: { 
        fileData,
        fileName: file.name,
        customPublicId: signature.public_id
      }
    });

    onProgress(90);

    if (error) {
      console.error('❌ HEIC: Edge Function error:', error);
      throw new Error(error.message || 'Failed to upload via Edge Function');
    }

    if (data?.success && data?.mainImageUrl) {
      console.log('✅ HEIC: Edge Function upload SUCCESS:', {
        publicId: data.publicId,
        url: data.mainImageUrl
      });
      
      onProgress(100);
      
      return {
        url: data.mainImageUrl,
        publicId: data.publicId || signature.public_id
      };
    } else {
      console.error('❌ HEIC: Edge Function upload failed:', data?.error);
      throw new Error(data?.error || 'Unknown error occurred in Edge Function');
    }
  } catch (error) {
    console.error('💥 HEIC: Exception in uploadViaEdgeFunction:', error);
    throw new Error(error instanceof Error ? error.message : 'Unknown error');
  }
};