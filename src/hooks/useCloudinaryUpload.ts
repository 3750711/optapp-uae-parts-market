import { useState, useCallback } from 'react';
import { toast } from "@/hooks/use-toast";
import { uploadToCloudinary } from "@/utils/cloudinaryUpload";
import { CLOUDINARY_CONFIG } from '@/config/cloudinary';

// === СТАРЫЙ ХУК (оригинальный useCloudinaryUpload) ===
interface CloudinaryUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  url?: string;
  mainImageUrl?: string;
  publicId?: string;
}

interface CloudinaryUploadOptions {
  productId?: string;
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
      console.log('🚀 Starting Cloudinary-only upload process for:', file.name);

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
      const cloudinaryResult = await uploadToCloudinary(file, options.productId);

      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);

      if (cloudinaryResult.success && cloudinaryResult.mainImageUrl) {
        console.log('✅ Cloudinary upload successful:', cloudinaryResult.publicId);
        
        setUploadProgress(prev => prev.map(p => 
          p.fileId === fileId 
            ? { 
                ...p, 
                status: 'success', 
                progress: 100,
                mainImageUrl: cloudinaryResult.mainImageUrl,
                publicId: cloudinaryResult.publicId
              }
            : p
        ));

        return cloudinaryResult.mainImageUrl;
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

// === НОВЫЙ ХУК (Cloudinary Upload Widget) ===
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

interface ValidationError {
  file: string;
  error: string;
}

export const useNewCloudinaryUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Валидация файлов на клиенте
  const validateFiles = useCallback((files: FileList | File[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    const fileArray = Array.isArray(files) ? files : Array.from(files);

    fileArray.forEach(file => {
      // Проверка размера файла
      if (file.size > CLOUDINARY_CONFIG.upload.maxFileSize) {
        errors.push({
          file: file.name,
          error: `Файл слишком большой. Максимум: ${CLOUDINARY_CONFIG.upload.maxFileSize / 1024 / 1024}MB`
        });
      }

      // Проверка формата файла
      const fileExtension = file.name.split('.').pop()?.toLowerCase() as any;
      if (!fileExtension || !CLOUDINARY_CONFIG.upload.allowedFormats.includes(fileExtension)) {
        errors.push({
          file: file.name,
          error: `Неподдерживаемый формат. Разрешены: ${CLOUDINARY_CONFIG.upload.allowedFormats.join(', ')}`
        });
      }

      // Проверка типа MIME
      if (!file.type.startsWith('image/')) {
        errors.push({
          file: file.name,
          error: 'Файл должен быть изображением'
        });
      }
    });

    return errors;
  }, []);

  const openUploadWidget = useCallback((
    onSuccess: (results: CloudinaryUploadResult[]) => void,
    options: {
      multiple?: boolean;
      maxFiles?: number;
      folder?: string;
      productId?: string;
    } = {}
  ) => {
    setValidationErrors([]);

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
      
      // Создаем публичный ID с учетом productId
      const publicIdPrefix = options.productId ? `products/${options.productId}` : 'products';
      
      const widget = cloudinary.createUploadWidget(
        {
          cloudName: CLOUDINARY_CONFIG.cloudName,
          uploadPreset: CLOUDINARY_CONFIG.uploadPresets.product,
          folder: options.folder || CLOUDINARY_CONFIG.upload.folder,
          publicIdPrefix: publicIdPrefix,
          multiple: options.multiple ?? true,
          maxFiles: options.maxFiles || CLOUDINARY_CONFIG.upload.maxFiles,
          maxFileSize: CLOUDINARY_CONFIG.upload.maxFileSize,
          clientAllowedFormats: CLOUDINARY_CONFIG.upload.allowedFormats,
          sources: CLOUDINARY_CONFIG.widget.sources,
          showAdvancedOptions: CLOUDINARY_CONFIG.widget.showAdvancedOptions,
          cropping: CLOUDINARY_CONFIG.widget.cropping,
          theme: CLOUDINARY_CONFIG.widget.theme,
          language: CLOUDINARY_CONFIG.widget.language,
          text: CLOUDINARY_CONFIG.widget.text,
          styles: CLOUDINARY_CONFIG.widget.styles,
          
          // Автоматические трансформации при загрузке
          transformation: [
            {
              quality: CLOUDINARY_CONFIG.upload.quality,
              format: 'auto'
            }
          ]
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

            console.log('✅ Cloudinary upload success:', {
              publicId: uploadResult.public_id,
              url: uploadResult.secure_url,
              size: `${uploadResult.width}x${uploadResult.height}`,
              bytes: uploadResult.bytes
            });

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
                description: `Успешно загружено ${successResults.length} файлов в Cloudinary`,
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
            console.error('❌ Cloudinary upload error:', error);
            setValidationErrors(prev => [...prev, {
              file: 'upload',
              error: error.message || "Произошла ошибка при загрузке файла"
            }]);
            
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

  // Метод для валидации и загрузки файлов с проверкой
  const uploadWithValidation = useCallback(async (
    files: FileList | File[],
    options: {
      productId?: string;
      folder?: string;
      onProgress?: (progress: UploadProgress[]) => void;
    } = {}
  ): Promise<string[]> => {
    // Валидация файлов
    const errors = validateFiles(files);
    if (errors.length > 0) {
      setValidationErrors(errors);
      errors.forEach(error => {
        toast({
          title: "Ошибка валидации",
          description: `${error.file}: ${error.error}`,
          variant: "destructive"
        });
      });
      return [];
    }

    // Запуск загрузки через виджет
    return new Promise((resolve) => {
      openUploadWidget(
        (results) => {
          const urls = results.map(result => result.secure_url);
          resolve(urls);
        },
        {
          multiple: true,
          maxFiles: Array.from(files).length,
          productId: options.productId,
          folder: options.folder
        }
      );
    });
  }, [openUploadWidget, validateFiles]);

  const clearProgress = useCallback(() => {
    setUploadProgress([]);
    setValidationErrors([]);
  }, []);

  const clearErrors = useCallback(() => {
    setValidationErrors([]);
  }, []);

  return {
    isUploading,
    uploadProgress,
    validationErrors,
    openUploadWidget,
    uploadWithValidation,
    validateFiles,
    clearProgress,
    clearErrors
  };
};