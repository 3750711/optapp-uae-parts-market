import { useState, useCallback } from 'react';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

interface UploadOptions {
  productId?: string;
  disableToast?: boolean;
}

export const useSimpleCloudinaryUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const uploadSingleFile = useCallback(async (
    file: File,
    fileId: string,
    options: UploadOptions = {}
  ): Promise<string> => {
    try {
      console.log('📤 Starting simple Cloudinary upload:', file.name);

      // Update progress - starting upload
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, status: 'uploading', progress: 10 }
          : p
      ));

      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, progress: 30 }
          : p
      ));

      // Call Cloudinary upload function
      const { data, error } = await supabase.functions.invoke('cloudinary-upload', {
        body: {
          base64,
          name: file.name,
          type: file.type,
          folder: options.productId ? `products/${options.productId}` : 'uploads'
        }
      });

      if (error) {
        throw new Error(error.message || 'Upload failed');
      }

      if (!data?.success || !data?.mainImageUrl) {
        throw new Error(data?.error || 'Upload failed');
      }

      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { 
              ...p, 
              status: 'success', 
              progress: 100,
              url: data.mainImageUrl
            }
          : p
      ));

      console.log('✅ Simple Cloudinary upload successful:', data.mainImageUrl);
      return data.mainImageUrl;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('💥 Simple upload error:', errorMessage);

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
    options: UploadOptions = {}
  ): Promise<string[]> => {
    setIsUploading(true);

    // Initialize progress tracking
    const initialProgress: UploadProgress[] = files.map((file, index) => ({
      fileId: `file-${Date.now()}-${index}`,
      fileName: file.name,
      progress: 0,
      status: 'pending'
    }));
    
    setUploadProgress(initialProgress);

    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (let i = 0; i < files.length; i++) {
        try {
          const fileId = initialProgress[i].fileId;
          const url = await uploadSingleFile(files[i], fileId, options);
          uploadedUrls.push(url);
        } catch (error) {
          errors.push(`${files[i].name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (!options.disableToast) {
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
      }

      return uploadedUrls;
    } finally {
      setIsUploading(false);
    }
  }, [uploadSingleFile]);

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