// Cloudinary configuration with PartsBay Brand Theme

export const CLOUDINARY_CONFIG = {
  cloudName: 'dcuziurrb',
  
  // Upload presets for different use cases
  uploadPresets: {
    product: 'partsbay_product',
    productUnsigned: 'partsbay_product_unsigned',
    productOptimized: 'partsbay_product_optimized',
    thumbnail: 'partsbay_thumbnail'
  },

  // Upload parameters
  uploadParams: {
    resourceType: 'auto' as const,
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const,
    maxFileSize: 10000000, // 10MB
    maxImageWidth: 2000,
    maxImageHeight: 2000,
    quality: 'auto:good' as const,
    fetchFormat: 'auto' as const,
    flags: 'progressive' as const
  },

  // Image transformations with optimized quality
  transformations: {
    thumbnail: {
      width: 150,
      height: 150,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto:good',
      format: 'webp'
    },
    medium: {
      width: 400,
      height: 400,
      crop: 'limit',
      quality: 'auto:good',
      format: 'webp'
    },
    large: {
      width: 800,
      height: 800,
      crop: 'limit',
      quality: 'auto:good',
      format: 'webp'
    },
    placeholder: {
      width: 50,
      height: 50,
      crop: 'fill',
      blur: 800,
      quality: 'auto:low',
      format: 'webp'
    },
    responsive: {
      mobile: {
        width: 400,
        crop: 'limit',
        quality: 'auto:good',
        format: 'webp'
      },
      tablet: {
        width: 600,
        crop: 'limit',
        quality: 'auto:good',
        format: 'webp'
      },
      desktop: {
        width: 1200,
        crop: 'limit',
        quality: 'auto:good',
        format: 'webp'
      }
    }
  },

  // Upload configuration
  upload: {
    cloudName: 'dcuziurrb',
    uploadPreset: 'partsbay_product_unsigned',
    multiple: true,
    maxFiles: 50,
    maxFileSize: 10000000,
    sources: ['local', 'camera', 'url'],
    cropping: false,
    resourceType: 'auto',
    clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    folder: 'products',
    quality: 'auto:good',
    transformation: {
      quality: 'auto:good',
      fetchFormat: 'auto',
      flags: 'progressive'
    }
  },

  // Widget configuration with PartsBay Brand
  widget: {
    theme: 'minimal',
    language: 'ru',
    sources: ['local', 'camera', 'url'],
    cropping: false,
    multiple: true,
    clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const,
    
    // Branding settings
    branding: false,
    showPoweredBy: false,
    
    // UX settings
    inline: false,
    defaultSource: 'local',
    maxImageFileSize: 10000000,
    maxVideoFileSize: 100000000,
    resourceType: 'auto',
    
    // Progress and preview
    showAdvancedOptions: false,
    showSkipCropButton: false,
    showUploadMoreButton: true,
    showProgressBar: true,
    queueViewPosition: 'bottom',
    showCompletedButton: true,
    
    // Mobile optimization
    googleApiKey: null,
    searchBySights: false,
    searchByRights: false,
    
    // PartsBay Brand Styling
    styles: {
      palette: {
        window: '#FFFFFF',
        windowBorder: '#E5E7EB',
        sourceBg: '#F9FAFB',
        tabIcon: '#6B7280',
        menuIcons: '#6B7280',
        textDark: '#111827',
        textLight: '#6B7280',
        link: '#3B82F6',
        action: '#3B82F6',
        inactiveTabIcon: '#9CA3AF',
        error: '#EF4444',
        inProgress: '#3B82F6',
        complete: '#10B981'
      },
      fonts: {
        default: null,
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif": {
          url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap",
          active: true
        }
      },
      frame: {
        background: "rgba(255,255,255,0.98)",
        border: "1px solid #E5E7EB",
        borderRadius: "16px",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
        backdropFilter: "blur(8px)"
      }
    },

    // Localization with PartsBay terms
    text: {
      ru: {
        'local.browse': '📷 Выбрать фотографии товара',
        'local.dd_title_single': 'Перетащите фото товара сюда',
        'local.dd_title_multi': 'Перетащите фотографии товара сюда',
        'camera.capture': '📱 Сфотографировать товар',
        'camera.cancel': 'Отмена',
        'camera.take_pic': 'Снимок',
        'camera.explanation': 'Убедитесь, что камера включена для съемки товара',
        'upload_tabs.url': '🔗 По ссылке',
        'upload_tabs.file': '📁 С устройства',
        'upload_tabs.camera': '📷 Камера',
        'queue.title': 'Загрузка фотографий',
        'queue.title_uploading_with_counter': 'Загружается {{num}} фотографий',
        'queue.title_uploading': 'Загружается фотография',
        'queue.mini_title': '✅ Загружено',
        'queue.mini_title_uploading': '⏳ Загружается...',
        'done.title': '🎉 Фотографии загружены!',
        'local.success': 'Фотографии успешно загружены',
        'progress.uploading': 'Загружаем ваши фотографии...',
        'or': 'или',
        'menu.close': 'Закрыть',
        'menu.back': 'Назад'
      }
    }
  }
} as const;

// Типы для трансформаций
export type TransformationType = keyof typeof CLOUDINARY_CONFIG.transformations;
export type ResponsiveSize = keyof typeof CLOUDINARY_CONFIG.transformations.responsive;

// URL generation utilities
export const buildCloudinaryUrl = (
  publicId: string, 
  transformation?: TransformationType | string,
  customParams?: Record<string, any>
) => {
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
  
  if (!transformation && !customParams) {
    return `${baseUrl}/${publicId}`;
  }

  let transformString = '';
  
  if (transformation) {
    if (typeof transformation === 'string') {
      transformString = transformation;
    } else {
      const config = CLOUDINARY_CONFIG.transformations[transformation];
      const params = Object.entries(config)
        .map(([key, value]) => `${getShortParam(key)}_${value}`)
        .join(',');
      transformString = params;
    }
  }

  if (customParams) {
    const customString = Object.entries(customParams)
      .map(([key, value]) => `${getShortParam(key)}_${value}`)
      .join(',');
    transformString = transformString 
      ? `${transformString},${customString}` 
      : customString;
  }

  return `${baseUrl}/${transformString}/${publicId}`;
};

// Helper function to map parameter names to short aliases
const getShortParam = (param: string): string => {
  const paramMap: Record<string, string> = {
    width: 'w',
    height: 'h',
    crop: 'c',
    quality: 'q',
    format: 'f',
    gravity: 'g',
    blur: 'e_blur',
    progressive: 'fl_progressive',
    fetchFormat: 'f_auto'
  };
  return paramMap[param] || param;
};

export const buildResponsiveUrl = (
  publicId: string, 
  size: ResponsiveSize,
  customParams?: Record<string, any>
) => {
  const config = CLOUDINARY_CONFIG.transformations.responsive[size];
  return buildCloudinaryUrl(publicId, undefined, { ...config, ...customParams });
};

export const buildPlaceholderUrl = (publicId: string) => {
  return buildCloudinaryUrl(publicId, 'placeholder');
};

export const getOptimizedImageUrl = (
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
    quality?: 'auto:low' | 'auto:good' | 'auto:best' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  }
) => {
  const defaultOptions = {
    quality: 'auto:good',
    format: 'auto',
    crop: 'limit'
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  return buildCloudinaryUrl(publicId, undefined, finalOptions);
};

// Upload preset utilities
export const validateUploadPreset = (presetName?: string): boolean => {
  if (!presetName) {
    console.warn('Upload preset name is required');
    return false;
  }
  return true;
};

export const getUploadPreset = (
  type: 'product' | 'productUnsigned' | 'productOptimized' | 'thumbnail' = 'productUnsigned'
): string => {
  const preset = CLOUDINARY_CONFIG.uploadPresets[type];
  
  if (!preset) {
    console.warn(`Upload preset for type "${type}" not found, falling back to productUnsigned`);
    return CLOUDINARY_CONFIG.uploadPresets.productUnsigned;
  }
  
  return preset;
};