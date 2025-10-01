import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";
import { uploadToCloudinary } from "@/utils/cloudinaryUpload";
import { toNormalized, CloudinaryNormalized } from "@/types/cloudinary";
import { getWidgetSources, getWidgetUXConfig } from '@/config/cloudinary';
import { CLOUDINARY_CONFIG, getUploadPreset, validateUploadPreset } from '@/config/cloudinary';

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
  // Для совместимости с Edge Function API
  mainImageUrl?: string;
}

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: CloudinaryUploadResult;
  normalized?: CloudinaryNormalized;
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
  
  // ✅ FIX: Используем только ref для синхронного накопления результатов
  // Это устраняет race condition между success и close events
  const successfulUploadsRef = useRef<CloudinaryNormalized[]>([]);
  
  // ✅ FIX: Сохраняем ссылку на виджет для cleanup
  const widgetRef = useRef<any>(null);
  
  // ✅ FIX: Cleanup виджета при unmount компонента
  useEffect(() => {
    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.close();
          widgetRef.current.destroy();
          console.log('🧹 Cloudinary widget cleaned up on unmount');
        } catch (error) {
          console.warn('⚠️ Widget cleanup error:', error);
        }
      }
    };
  }, []);

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
    onSuccess: (results: CloudinaryNormalized[]) => void,
    options: {
      multiple?: boolean;
      maxFiles?: number;
      folder?: string;
      productId?: string;
    } = {}
  ) => {
    setValidationErrors([]);
    successfulUploadsRef.current = []; // ✅ FIX: Сбрасываем ref синхронно ПЕРЕД открытием виджета

    // Проверяем, загружен ли Cloudinary Widget
    if (typeof window !== 'undefined' && !(window as any).cloudinary) {
      // Проверяем, не начали ли уже загрузку скрипта
      const existingScript = document.querySelector('script[src="https://upload-widget.cloudinary.com/global/all.js"]');
      
      if (existingScript) {
        // Скрипт уже загружается или загружен, ждем готовности
        if ((window as any).cloudinary) {
          initializeWidget();
        } else {
          existingScript.addEventListener('load', () => initializeWidget());
        }
      } else {
        // Загружаем скрипт динамически
        const script = document.createElement('script');
        script.src = 'https://upload-widget.cloudinary.com/global/all.js';
        script.onload = () => initializeWidget();
        document.head.appendChild(script);
      }
    } else {
      initializeWidget();
    }

    function initializeWidget() {
      const cloudinary = (window as any).cloudinary;
      
      // Создаем публичный ID с учетом productId
      const publicIdPrefix = options.productId ? `products/${options.productId}` : 'products';
      
      // Получаем preset с валидацией
      const uploadPreset = getUploadPreset('productUnsigned');
      console.log('🔧 Cloudinary Widget: Using upload preset:', uploadPreset);
      
      // Определяем темную тему
      const isDark = document.documentElement.classList.contains("dark");
      
      // Получаем конфигурацию источников и UX настроек
      const isMobileWidget = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const widgetSources = getWidgetSources(isMobileWidget);
      const uxConfig = getWidgetUXConfig(isMobileWidget);
      
      // 🔍 Диагностика: Логируем платформу и конфигурацию
      console.log('📱 Platform detection:', {
        isMobile: isMobileWidget,
        userAgent: navigator.userAgent,
        sources: widgetSources,
        uxConfig
      });
      
      // Создаем конфигурацию виджета с поддержкой темной темы
      const widgetStyles = {
        ...CLOUDINARY_CONFIG.widget.styles,
        palette: isDark ? {
          window: "#0B0F1A",
          windowBorder: "#111827",
          sourceBg: "#0F172A",
          tabIcon: "#CBD5E1",
          menuIcons: "#CBD5E1",
          textDark: "#E5E7EB",
          textLight: "#94A3B8",
          link: "#60A5FA",
          action: "#60A5FA",
          inactiveTabIcon: "#64748B",
          error: "#F87171",
          inProgress: "#60A5FA",
          complete: "#34D399"
        } : CLOUDINARY_CONFIG.widget.styles.palette,
        frame: {
          ...CLOUDINARY_CONFIG.widget.styles.frame,
          background: isDark ? "rgba(11,15,26,0.98)" : "rgba(255,255,255,0.98)",
          border: isDark ? "1px solid #111827" : "1px solid #E5E7EB"
        }
      };

      const widget = cloudinary.createUploadWidget(
        {
          cloudName: CLOUDINARY_CONFIG.cloudName,
          uploadPreset: uploadPreset,
          folder: options.folder || CLOUDINARY_CONFIG.upload.folder,
          publicIdPrefix: publicIdPrefix,
          multiple: options.multiple ?? true,
          maxFiles: options.maxFiles || CLOUDINARY_CONFIG.upload.maxFiles,
          maxFileSize: CLOUDINARY_CONFIG.upload.maxFileSize,
          clientAllowedFormats: CLOUDINARY_CONFIG.upload.allowedFormats,
          sources: widgetSources,
          ...uxConfig,
          theme: CLOUDINARY_CONFIG.widget.theme,
          language: CLOUDINARY_CONFIG.widget.language,
          text: CLOUDINARY_CONFIG.widget.text,
          styles: widgetStyles,
          
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

            // Нормализуем результат
            const normalized = toNormalized(uploadResult);
            
            if (process.env.NODE_ENV !== "production") {
              console.debug("[useNewCloudinaryUpload] success normalized:", normalized);
            }

            if (normalized) {
              console.log('📸 Upload success, normalized result:', normalized);

              // ✅ FIX: Прямая синхронная запись в ref (нет асинхронного state update)
              successfulUploadsRef.current = [
                ...successfulUploadsRef.current,
                normalized
              ];
              
              console.log('✅ Total uploads in ref:', successfulUploadsRef.current.length);
            }

            // Обновляем прогресс
            setUploadProgress(prev => prev.map(p => 
              p.fileName === result.info.original_filename 
                ? { ...p, status: 'success', progress: 100, result: uploadResult }
                : p
            ));
          }

          if (result && result.event === 'close') {
            // ✅ FIX: ref всегда актуален (синхронное обновление в success event)
            const currentUploads = successfulUploadsRef.current;
            console.log('🎯 Widget closed, successful uploads:', currentUploads.length);
            
            if (currentUploads.length > 0) {
              onSuccess(currentUploads);
              toast({
                title: "Загрузка завершена",
                description: `Успешно загружено ${currentUploads.length} файлов`,
              });
            }
            
            setIsUploading(false);
            setUploadProgress([]);
            successfulUploadsRef.current = []; // ✅ FIX: Очистка ПОСЛЕ передачи результатов
            
            // Генерируем пользовательское событие для сброса состояния виджета
            document.dispatchEvent(new CustomEvent('cloudinary-widget-close'));
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

      widgetRef.current = widget; // ✅ FIX: Сохраняем виджет в ref для cleanup
      setIsUploading(true);
      
      // 🔍 Диагностика: Логируем открытие виджета
      console.log('🎬 Opening Cloudinary widget...', {
        isMobile: isMobileWidget,
        cloudName: CLOUDINARY_CONFIG.cloudName,
        uploadPreset,
        maxFiles: options.maxFiles || CLOUDINARY_CONFIG.upload.maxFiles
      });
      
      widget.open();
      
      // 🔍 Диагностика: Проверяем состояние DOM после открытия
      setTimeout(() => {
        const overlay = document.querySelector('#cloudinary-overlay');
        const iframe = document.querySelector('.cloudinary-widget iframe');
        console.log('🔍 Widget DOM state:', {
          overlayExists: !!overlay,
          overlayZIndex: overlay ? window.getComputedStyle(overlay).zIndex : 'N/A',
          iframeExists: !!iframe,
          iframeZIndex: iframe ? window.getComputedStyle(iframe).zIndex : 'N/A',
          iframePointerEvents: iframe ? window.getComputedStyle(iframe).pointerEvents : 'N/A'
        });
      }, 500);
    }
  }, [uploadProgress]); // ✅ FIX: Убрали successfulUploads из deps (используем только ref)

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
          const urls = results.map(result => result.url);
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