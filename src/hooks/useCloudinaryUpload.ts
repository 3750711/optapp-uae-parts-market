import { useState, useCallback } from 'react';
import { toast } from "@/hooks/use-toast";
import { CLOUDINARY_CONFIG } from '@/config/cloudinary';

// Новый хук для Cloudinary Upload Widget

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: CloudinaryUploadResult;
}

export const useNewCloudinaryUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const openUploadWidget = useCallback((
    onSuccess: (results: CloudinaryUploadResult[]) => void,
    options: {
      multiple?: boolean;
      maxFiles?: number;
      folder?: string;
    } = {}
  ) => {
    // Загружаем Cloudinary Upload Widget динамически
    if (typeof window !== 'undefined' && !(window as any).cloudinary) {
      const script = document.createElement('script');
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.onload = () => initializeWidget();
      document.head.appendChild(script);
    } else {
      initializeWidget();
    }

    function initializeWidget() {
      const cloudinary = (window as any).cloudinary;
      
      const widget = cloudinary.createUploadWidget(
        {
          cloudName: CLOUDINARY_CONFIG.cloudName,
          uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
          folder: options.folder || CLOUDINARY_CONFIG.folder,
          multiple: options.multiple ?? true,
          maxFiles: options.maxFiles || 10,
          maxFileSize: CLOUDINARY_CONFIG.maxFileSize,
          clientAllowedFormats: CLOUDINARY_CONFIG.allowedFormats,
          sources: ['local', 'camera', 'url'],
          showAdvancedOptions: false,
          cropping: false,
          theme: 'minimal',
          styles: {
            palette: {
              window: '#FFFFFF',
              windowBorder: '#E5E7EB',
              tabIcon: '#6B7280',
              menuIcons: '#6B7280',
              textDark: '#111827',
              textLight: '#6B7280',
              link: '#3B82F6',
              action: '#3B82F6',
              inactiveTabIcon: '#9CA3AF',
              error: '#EF4444',
              inProgress: '#3B82F6',
              complete: '#10B981',
              sourceBg: '#F9FAFB'
            },
            fonts: {
              default: null,
              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif": {
                url: null,
                active: true
              }
            }
          }
        },
        (error: any, result: any) => {
          if (!error && result && result.event === 'success') {
            const uploadResult: CloudinaryUploadResult = {
              public_id: result.info.public_id,
              secure_url: result.info.secure_url,
              url: result.info.url,
              width: result.info.width,
              height: result.info.height,
              format: result.info.format,
              bytes: result.info.bytes
            };

            // Обновляем прогресс
            setUploadProgress(prev => prev.map(p => 
              p.fileName === result.info.original_filename 
                ? { ...p, status: 'success', progress: 100, result: uploadResult }
                : p
            ));
          }

          if (result && result.event === 'close') {
            // Собираем все успешно загруженные файлы
            const successResults = uploadProgress
              .filter(p => p.status === 'success' && p.result)
              .map(p => p.result!) as CloudinaryUploadResult[];
            
            if (successResults.length > 0) {
              onSuccess(successResults);
              toast({
                title: "Загрузка завершена",
                description: `Успешно загружено ${successResults.length} файлов`,
              });
            }
            
            setIsUploading(false);
            setUploadProgress([]);
          }

          if (result && result.event === 'upload') {
            const progress = Math.round((result.info.bytes / result.info.total_bytes) * 100);
            setUploadProgress(prev => {
              const existing = prev.find(p => p.fileName === result.info.original_filename);
              if (existing) {
                return prev.map(p => 
                  p.fileName === result.info.original_filename 
                    ? { ...p, progress, status: 'uploading' }
                    : p
                );
              } else {
                return [...prev, {
                  fileId: `file-${Date.now()}-${Math.random()}`,
                  fileName: result.info.original_filename,
                  progress,
                  status: 'uploading'
                }];
              }
            });
          }

          if (error) {
            console.error('Upload error:', error);
            toast({
              title: "Ошибка загрузки",
              description: error.message || "Произошла ошибка при загрузке файла",
              variant: "destructive"
            });
          }
        }
      );

      setIsUploading(true);
      widget.open();
    }
  }, [uploadProgress]);

  const clearProgress = useCallback(() => {
    setUploadProgress([]);
  }, []);

  return {
    isUploading,
    uploadProgress,
    openUploadWidget,
    clearProgress
  };
};