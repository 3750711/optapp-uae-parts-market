
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CloudinaryVideoUploadResult {
  success: boolean;
  cloudinaryUrl?: string;
  publicId?: string;
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

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  cloudinaryUrl?: string;
  publicId?: string;
  duration?: number;
  thumbnailUrl?: string;
}

export const useCloudinaryVideoUpload = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const uploadVideo = async (
    file: File,
    productId?: string,
    customPublicId?: string
  ): Promise<CloudinaryVideoUploadResult> => {
    const fileId = `${file.name}-${Date.now()}`;
    
    try {
      console.log('📤 Starting video upload with FormData:', {
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

      // Create FormData for direct upload (same as photos)
      const formData = new FormData();
      formData.append('file', file);
      
      if (productId) {
        formData.append('productId', productId);
      }
      
      if (customPublicId) {
        formData.append('customPublicId', customPublicId);
      }
      
      console.log('☁️ Uploading video with FormData to Cloudinary...');
      
      // Update progress
      setUploadProgress(prev => 
        prev.map(p => p.fileId === fileId ? { ...p, progress: 50 } : p)
      );
      
      // Use the dedicated video upload function with FormData
      const { data, error } = await supabase.functions.invoke('cloudinary-video-upload', {
        body: formData
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
          sizeKB: Math.round((data.originalSize || 0) / 1024),
          duration: data.duration,
          thumbnailUrl: data.thumbnailUrl
        });
        
        // Update progress to success
        setUploadProgress(prev => 
          prev.map(p => p.fileId === fileId ? { 
            ...p, 
            status: 'success', 
            progress: 100,
            cloudinaryUrl: data.cloudinaryUrl,
            publicId: data.publicId,
            duration: data.duration,
            thumbnailUrl: data.thumbnailUrl
          } : p)
        );
        
        return {
          success: true,
          cloudinaryUrl: data.cloudinaryUrl,
          publicId: data.publicId,
          thumbnailUrl: data.thumbnailUrl,
          originalSize: data.originalSize,
          compressedSize: data.compressedSize,
          format: data.format,
          duration: data.duration,
          width: data.width,
          height: data.height,
          bitRate: data.bitRate,
          frameRate: data.frameRate
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
    console.log('🎬 Starting multiple video upload:', { fileCount: files.length });
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

      console.log('🎉 Multiple video upload completed:', {
        totalFiles: files.length,
        successfulUploads: uploadedUrls.length
      });

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
      console.log('🏁 Setting isUploading to false');
      setIsUploading(false);
    }
  };

  const clearProgress = () => {
    console.log('🧹 Clearing upload progress');
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
