
import { useState, useCallback } from 'react';
import { toast } from "@/hooks/use-toast";
import { uploadDirectToCloudinary } from "@/utils/cloudinaryUpload";

interface CloudinaryUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  url?: string;
  cloudinaryUrl?: string;
  publicId?: string;
  fileSize?: number;
}

interface CloudinaryUploadOptions {
  productId?: string;
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
      console.log('🚀 Starting direct Cloudinary upload for:', file.name);

      // Update progress - starting upload (более детальный прогресс)
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, status: 'uploading', progress: 10, fileSize: file.size }
          : p
      ));

      // Подготовка файла
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, progress: 25 }
          : p
      ));

      // Начало загрузки
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, progress: 40 }
          : p
      ));

      // Upload directly to Cloudinary using the file object
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, status: 'processing', progress: 60 }
          : p
      ));

      console.log('☁️ Uploading to Cloudinary with file object...');
      const cloudinaryResult = await uploadDirectToCloudinary(file, options.productId);

      // Финальная обработка
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, progress: 85 }
          : p
      ));

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
        throw new Error(cloudinaryResult.error || 'Cloudinary upload failed');
      }

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

    // Initialize progress tracking with file sizes
    const initialProgress: CloudinaryUploadProgress[] = files.map((file, index) => ({
      fileId: `file-${Date.now()}-${index}`,
      fileName: file.name,
      progress: 0,
      status: 'pending',
      fileSize: file.size
    }));
    
    setUploadProgress(initialProgress);

    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    try {
      // Загружаем файлы последовательно для лучшего контроля прогресса
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
          description: `Успешно загружено ${uploadedUrls.length} из ${files.length} файлов в Cloudinary`,
        });
      }

      if (errors.length > 0) {
        toast({
          title: "Ошибки загрузки",
          description: `Не удалось загрузить ${errors.length} файлов в Cloudinary`,
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
