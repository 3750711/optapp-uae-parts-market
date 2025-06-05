
import { useState, useCallback } from 'react';
import { toast } from "@/hooks/use-toast";
import { uploadToCloudinary } from "@/utils/cloudinaryUpload";
import { uploadImageToStorage } from "@/utils/imageProcessingUtils";

interface CloudinaryUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  url?: string;
  cloudinaryUrl?: string;
  publicId?: string;
}

interface CloudinaryUploadOptions {
  productId?: string;
  storageBucket?: string;
  storagePath?: string;
  uploadToCloudinary?: boolean;
}

export const useCloudinaryUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<CloudinaryUploadProgress[]>([]);

  const uploadFile = useCallback(async (
    file: File,
    fileId: string,
    options: CloudinaryUploadOptions = {}
  ): Promise<string> => {
    try {
      console.log('🚀 Starting Cloudinary upload process for:', file.name);

      // Update progress - starting upload
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, status: 'uploading', progress: 10 }
          : p
      ));

      // First upload to Supabase Storage
      const storageUrl = await uploadImageToStorage(
        file,
        options.storageBucket || 'product-images',
        options.storagePath || ''
      );

      console.log('✅ Supabase upload completed:', storageUrl);

      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, progress: 50, url: storageUrl }
          : p
      ));

      // Upload to Cloudinary if enabled
      if (options.uploadToCloudinary !== false) {
        setUploadProgress(prev => prev.map(p => 
          p.fileId === fileId 
            ? { ...p, status: 'processing', progress: 70 }
            : p
        ));

        console.log('☁️ Starting Cloudinary upload...');
        const cloudinaryResult = await uploadToCloudinary(storageUrl, options.productId);

        if (cloudinaryResult.success && cloudinaryResult.cloudinaryUrl) {
          console.log('✅ Cloudinary upload successful:', cloudinaryResult.publicId);
          
          setUploadProgress(prev => prev.map(p => 
            p.fileId === fileId 
              ? { 
                  ...p, 
                  status: 'success', 
                  progress: 100,
                  cloudinaryUrl: cloudinaryResult.cloudinaryUrl,
                  publicId: cloudinaryResult.publicId
                }
              : p
          ));

          return cloudinaryResult.cloudinaryUrl;
        } else {
          console.warn('⚠️ Cloudinary upload failed, using storage URL:', cloudinaryResult.error);
          
          setUploadProgress(prev => prev.map(p => 
            p.fileId === fileId 
              ? { 
                  ...p, 
                  status: 'success', 
                  progress: 100,
                  error: 'Cloudinary upload failed, using storage URL'
                }
              : p
          ));

          return storageUrl;
        }
      }

      // If Cloudinary is disabled, just return storage URL
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, status: 'success', progress: 100 }
          : p
      ));

      return storageUrl;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('💥 Upload error:', errorMessage);

      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, status: 'error', error: errorMessage }
          : p
      ));

      throw error;
    }
  }, []);

  const uploadFiles = useCallback(async (
    files: File[],
    options: CloudinaryUploadOptions = {}
  ): Promise<string[]> => {
    setIsUploading(true);

    // Initialize progress tracking
    const initialProgress: CloudinaryUploadProgress[] = files.map((file, index) => ({
      fileId: `file-${Date.now()}-${index}`,
      fileName: file.name,
      progress: 0,
      status: 'pending'
    }));
    
    setUploadProgress(initialProgress);

    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        try {
          const fileId = initialProgress[i].fileId;
          const url = await uploadFile(files[i], fileId, options);
          uploadedUrls.push(url);
        } catch (error) {
          errors.push(`${files[i].name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (uploadedUrls.length > 0) {
        toast({
          title: "Загрузка завершена",
          description: `Успешно загружено ${uploadedUrls.length} из ${files.length} файлов`,
        });
      }

      if (errors.length > 0) {
        toast({
          title: "Ошибки загрузки",
          description: `Не удалось загрузить ${errors.length} файлов`,
          variant: "destructive",
        });
      }

      return uploadedUrls;
    } finally {
      setIsUploading(false);
    }
  }, [uploadFile]);

  const clearProgress = useCallback(() => {
    setUploadProgress([]);
  }, []);

  return {
    isUploading,
    uploadProgress,
    uploadFiles,
    clearProgress
  };
};
