import { useState, useCallback } from 'react';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UploadProgress {
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

  const uploadSingleFile = useCallback(async (
    file: File,
    fileId: string,
    options: UploadOptions = {}
  ): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('📤 Starting real-time Cloudinary upload:', file.name);

        // Update progress - starting upload
        setUploadProgress(prev => prev.map(p => 
          p.fileId === fileId 
            ? { ...p, status: 'uploading', progress: 0 }
            : p
        ));

        const folder = options.productId ? `products/${options.productId}` : 'uploads';

        // Get signed upload parameters
        const { data: signData, error: signError } = await supabase.functions.invoke('cloudinary-sign', {
          body: { folder }
        });

        console.log('🔐 Sign response:', { signData, signError });

        if (signError) {
          throw new Error(`Sign request failed: ${signError.message}`);
        }
        
        if (!signData) {
          throw new Error('No response from sign function');
        }
        
        if (!signData.success) {
          throw new Error(signData.error || 'Failed to generate upload signature');
        }
        
        if (!signData.formData || !signData.uploadUrl) {
          throw new Error('Invalid response from sign function - missing formData or uploadUrl');
        }

        // Create FormData for direct Cloudinary upload
        const formData = new FormData();
        formData.append('file', file);
        
        // Add signed parameters
        Object.entries(signData.formData as Record<string, string>).forEach(([key, value]) => {
          formData.append(key, value);
        });

        // Create XMLHttpRequest for real progress tracking
        const xhr = new XMLHttpRequest();

        // Handle upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 90); // Reserve 10% for processing
            setUploadProgress(prev => prev.map(p => 
              p.fileId === fileId 
                ? { ...p, progress, status: 'uploading' }
                : p
            ));
          }
        };

        // Handle upload completion
        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              
              // Set processing state
              setUploadProgress(prev => prev.map(p => 
                p.fileId === fileId 
                  ? { ...p, progress: 95, status: 'processing' }
                  : p
              ));

              // Clean the public_id by removing version prefix and file extension
              const cleanPublicId = response.public_id
                .replace(/^v\d+\//, '') // Remove version prefix like v1234567890/
                .replace(/\.[^/.]+$/, ''); // Remove file extension

              // Generate the final WebP URL
              const mainImageUrl = `https://res.cloudinary.com/dcuziurrb/image/upload/f_webp,q_auto:good,c_limit,w_1200/${cleanPublicId}`;

              setUploadProgress(prev => prev.map(p => 
                p.fileId === fileId 
                  ? { 
                      ...p, 
                      status: 'success', 
                      progress: 100,
                      url: mainImageUrl
                    }
                  : p
              ));

              console.log('✅ Real-time Cloudinary upload successful:', mainImageUrl);
              resolve(mainImageUrl);
            } catch (parseError) {
              console.error('💥 Failed to parse Cloudinary response:', parseError);
              setUploadProgress(prev => prev.map(p => 
                p.fileId === fileId 
                  ? { ...p, status: 'error', error: 'Failed to process response' }
                  : p
              ));
              reject(new Error('Failed to process response'));
            }
          } else {
            const errorMessage = `Upload failed with status ${xhr.status}`;
            console.error('💥 Cloudinary upload error:', errorMessage);
            setUploadProgress(prev => prev.map(p => 
              p.fileId === fileId 
                ? { ...p, status: 'error', error: errorMessage }
                : p
            ));
            reject(new Error(errorMessage));
          }
        };

        // Handle upload errors
        xhr.onerror = () => {
          const errorMessage = 'Network error during upload';
          console.error('💥 Upload network error');
          setUploadProgress(prev => prev.map(p => 
            p.fileId === fileId 
              ? { ...p, status: 'error', error: errorMessage }
              : p
          ));
          reject(new Error(errorMessage));
        };

        // Handle upload timeout
        xhr.ontimeout = () => {
          const errorMessage = 'Upload timeout';
          console.error('💥 Upload timeout');
          setUploadProgress(prev => prev.map(p => 
            p.fileId === fileId 
              ? { ...p, status: 'error', error: errorMessage }
              : p
          ));
          reject(new Error(errorMessage));
        };

        // Set timeout to 2 minutes
        xhr.timeout = 120000;

        // Start the upload
        xhr.open('POST', signData.uploadUrl);
        xhr.send(formData);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        console.error('💥 Upload setup error:', errorMessage);

        setUploadProgress(prev => prev.map(p => 
          p.fileId === fileId 
            ? { ...p, status: 'error', error: errorMessage }
            : p
        ));

        reject(error);
      }
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