
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CloudinaryVideoUploadResult {
  success: boolean;
  cloudinaryUrl?: string;
  publicId?: string;
  originalSize?: number;
  format?: string;
  duration?: number;
  thumbnailUrl?: string;
  error?: string;
}

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  cloudinaryUrl?: string;
  publicId?: string;
  duration?: number;
}

export const useCloudinaryVideoUpload = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:video/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const uploadVideo = async (
    file: File,
    productId?: string,
    customPublicId?: string
  ): Promise<CloudinaryVideoUploadResult> => {
    const fileId = `${file.name}-${Date.now()}`;
    
    try {
      console.log('📤 Converting video file to base64 for Cloudinary upload:', {
        fileName: file.name,
        fileSize: file.size,
        productId,
        customPublicId
      });

      // Add to progress tracking
      const progressItem: UploadProgress = {
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'pending'
      };
      
      setUploadProgress(prev => [...prev, progressItem]);

      // Update progress to uploading
      setUploadProgress(prev => 
        prev.map(p => p.fileId === fileId ? { ...p, status: 'uploading', progress: 25 } : p)
      );

      // Convert file to base64
      const fileData = await fileToBase64(file);
      
      // Update progress
      setUploadProgress(prev => 
        prev.map(p => p.fileId === fileId ? { ...p, progress: 50 } : p)
      );
      
      console.log('☁️ Sending video to Cloudinary edge function...');
      
      // Fixed function name: use 'cloudinary-upload' instead of 'upload-to-cloudinary'
      const { data, error } = await supabase.functions.invoke('cloudinary-upload', {
        body: { 
          fileData,
          fileName: file.name,
          productId,
          customPublicId,
          isVideo: true // Add parameter to indicate this is a video
        }
      });

      console.log('📥 Cloudinary video function response:', {
        data,
        error,
        hasData: !!data,
        hasError: !!error
      });

      if (error) {
        console.error('❌ Cloudinary video function error:', error);
        setUploadProgress(prev => 
          prev.map(p => p.fileId === fileId ? { 
            ...p, 
            status: 'error', 
            progress: 0,
            error: error.message || 'Failed to upload video to Cloudinary'
          } : p)
        );
        return {
          success: false,
          error: error.message || 'Failed to upload video to Cloudinary'
        };
      }

      if (data?.success) {
        console.log('✅ Cloudinary video upload SUCCESS:', {
          cloudinaryUrl: data.cloudinaryUrl,
          publicId: data.publicId,
          format: data.format,
          sizeKB: Math.round(data.originalSize / 1024),
          duration: data.duration
        });
        
        // Update progress to success
        setUploadProgress(prev => 
          prev.map(p => p.fileId === fileId ? { 
            ...p, 
            status: 'success', 
            progress: 100,
            cloudinaryUrl: data.cloudinaryUrl,
            publicId: data.publicId,
            duration: data.duration
          } : p)
        );
        
        return {
          success: true,
          cloudinaryUrl: data.cloudinaryUrl,
          publicId: data.publicId,
          originalSize: data.originalSize,
          format: data.format,
          duration: data.duration,
          thumbnailUrl: data.thumbnailUrl
        };
      } else {
        console.error('❌ Cloudinary video upload failed:', data?.error);
        setUploadProgress(prev => 
          prev.map(p => p.fileId === fileId ? { 
            ...p, 
            status: 'error', 
            progress: 0,
            error: data?.error || 'Unknown error occurred'
          } : p)
        );
        return {
          success: false,
          error: data?.error || 'Unknown error occurred'
        };
      }
    } catch (error) {
      console.error('💥 EXCEPTION in uploadVideo:', error);
      setUploadProgress(prev => 
        prev.map(p => p.fileId === fileId ? { 
          ...p, 
          status: 'error', 
          progress: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        } : p)
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const uploadMultipleVideos = async (
    files: File[],
    productId?: string
  ): Promise<string[]> => {
    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const result = await uploadVideo(file, productId);
        if (result.success && result.cloudinaryUrl) {
          uploadedUrls.push(result.cloudinaryUrl);
        } else {
          toast({
            title: "Ошибка загрузки видео",
            description: `Не удалось загрузить ${file.name}: ${result.error}`,
            variant: "destructive",
          });
        }
      }

      if (uploadedUrls.length > 0) {
        toast({
          title: "Видео загружены",
          description: `Успешно загружено ${uploadedUrls.length} видео через Cloudinary`,
        });
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading multiple videos:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при загрузке видео",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const clearProgress = () => {
    setUploadProgress([]);
  };

  return {
    uploadVideo,
    uploadMultipleVideos,
    isUploading,
    uploadProgress,
    clearProgress
  };
};
