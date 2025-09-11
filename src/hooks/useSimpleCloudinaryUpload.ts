import { useState, useCallback } from 'react';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
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

  // Auto-clear completed uploads after delay
  const clearCompletedAfterDelay = useCallback(() => {
    setTimeout(() => {
      setUploadProgress(prev => prev.filter(p => p.status !== 'success' && p.status !== 'error'));
    }, 3000);
  }, []);

  const uploadSingleFile = useCallback(async (
    file: File,
    fileId: string,
    options: UploadOptions = {}
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      console.log('📤 Starting XMLHttpRequest upload:', file.name);

      // Update progress - starting upload
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, status: 'uploading', progress: 0 }
          : p
      ));

      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      
      // Append file and metadata
      formData.append('file', file);
      formData.append('name', file.name);
      formData.append('type', file.type);
      formData.append('folder', options.productId ? `products/${options.productId}` : 'uploads');

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 90); // Reserve 10% for server processing
          setUploadProgress(prev => prev.map(p => 
            p.fileId === fileId 
              ? { ...p, progress, status: 'uploading' }
              : p
          ));
        }
      });

      // Handle successful response
      xhr.addEventListener('load', () => {
        try {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            
            if (response.success && response.mainImageUrl) {
              // Show processing status briefly
              setUploadProgress(prev => prev.map(p => 
                p.fileId === fileId 
                  ? { ...p, status: 'processing', progress: 95 }
                  : p
              ));

              // Complete after short delay
              setTimeout(() => {
                setUploadProgress(prev => prev.map(p => 
                  p.fileId === fileId 
                    ? { 
                        ...p, 
                        status: 'success', 
                        progress: 100,
                        url: response.mainImageUrl
                      }
                    : p
                ));
                
                console.log('✅ XMLHttpRequest upload successful:', response.mainImageUrl);
                resolve(response.mainImageUrl);
              }, 300);
            } else {
              throw new Error(response.error || 'Upload failed');
            }
          } else {
            throw new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          console.error('💥 Upload response error:', errorMessage);
          
          setUploadProgress(prev => prev.map(p => 
            p.fileId === fileId 
              ? { ...p, status: 'error', error: errorMessage }
              : p
          ));
          
          reject(error);
        }
      });

      // Handle network errors
      xhr.addEventListener('error', () => {
        const errorMessage = 'Network error during upload';
        console.error('💥 Network error:', errorMessage);
        
        setUploadProgress(prev => prev.map(p => 
          p.fileId === fileId 
            ? { ...p, status: 'error', error: errorMessage }
            : p
        ));
        
        reject(new Error(errorMessage));
      });

      // Open connection and send
      xhr.open('POST', `${supabase.supabaseUrl}/functions/v1/cloudinary-upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${supabase.supabaseKey}`);
      xhr.send(formData);
    });
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

      // Clear completed uploads after delay for better UX
      if (uploadedUrls.length > 0) {
        clearCompletedAfterDelay();
      }

      return uploadedUrls;
    } finally {
      setIsUploading(false);
    }
  }, [uploadSingleFile, clearCompletedAfterDelay]);

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