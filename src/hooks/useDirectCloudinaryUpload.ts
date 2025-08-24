import { useState, useCallback } from 'react';
import { toast } from "@/hooks/use-toast";

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  url?: string;
  publicId?: string;
}

interface UploadOptions {
  productId?: string;
  maxSizeMB?: number;
  quality?: number;
}

// Direct Cloudinary upload function
const uploadDirectToCloudinary = async (file: File, options: UploadOptions = {}) => {
  const CLOUDINARY_UPLOAD_PRESET = 'ml_default';
  const CLOUDINARY_CLOUD_NAME = 'dpkpkmyqs';
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'products');
  
  if (options.productId) {
    formData.append('public_id', `${options.productId}_${Date.now()}`);
  }

  const response = await fetch(CLOUDINARY_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  return {
    success: true,
    publicId: result.public_id,
    url: result.secure_url,
    originalSize: file.size,
    compressedSize: result.bytes,
  };
};

export const useDirectCloudinaryUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const uploadFile = useCallback(async (
    file: File,
    fileId: string,
    options: UploadOptions = {}
  ): Promise<string> => {
    try {
      console.log('🚀 Starting direct Cloudinary upload for:', file.name);

      // Update progress - starting upload
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, status: 'uploading', progress: 10 }
          : p
      ));

      // Create a blob URL for preview
      const blobUrl = URL.createObjectURL(file);

      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, progress: 50, url: blobUrl }
          : p
      ));

      // Upload directly to Cloudinary
      setUploadProgress(prev => prev.map(p => 
        p.fileId === fileId 
          ? { ...p, status: 'processing', progress: 70 }
          : p
      ));

      console.log('☁️ Starting Cloudinary upload...');
      const cloudinaryResult = await uploadDirectToCloudinary(file, options);

      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);

      if (cloudinaryResult.success && cloudinaryResult.url) {
        console.log('✅ Cloudinary upload successful:', cloudinaryResult.publicId);
        
        setUploadProgress(prev => prev.map(p => 
          p.fileId === fileId 
            ? { 
                ...p, 
                status: 'success', 
                progress: 100,
                url: cloudinaryResult.url,
                publicId: cloudinaryResult.publicId
              }
            : p
        ));

        return cloudinaryResult.url;
      } else {
        throw new Error('Cloudinary upload failed');
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