// Конфигурация Cloudinary для загрузки изображений товаров
export const CLOUDINARY_CONFIG = {
  cloudName: 'dcuziurrb',
  
  // Upload presets для разных типов загрузок
  uploadPresets: {
    product: 'ml_default', // Основной preset для изображений товаров (должен быть unsigned)
    productUnsigned: 'product_images_unsigned', // Unsigned preset для прямых загрузок
    productOptimized: 'product_optimized', // Оптимизированный preset (если создан)
    thumbnail: 'thumbnail_preset' // Для превью (если создан)
  },
  
  // Настройки загрузки
  upload: {
    folder: 'product-images',
    maxFileSize: 10000000, // 10MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const,
    maxFiles: 10,
    autoOptimize: true,
    quality: 'auto:good'
  },

  // Автоматические трансформации для разных размеров
  transformations: {
    // Превью для карточек товаров
    thumbnail: {
      width: 200,
      height: 200,
      crop: 'fill',
      format: 'auto',
      quality: 'auto:good',
      dpr: 'auto'
    },
    
    // Средний размер для детального просмотра
    medium: {
      width: 500,
      height: 500,
      crop: 'limit',
      format: 'auto',
      quality: 'auto:good',
      dpr: 'auto'
    },
    
    // Большой размер для полноэкранного просмотра
    large: {
      width: 1200,
      height: 1200,
      crop: 'limit',
      format: 'auto',
      quality: 'auto:good',
      dpr: 'auto'
    },
    
    // Сверхмалый размер для lazy loading
    placeholder: {
      width: 50,
      height: 50,
      crop: 'fill',
      format: 'auto',
      quality: 'auto:low',
      blur: 1000,
      dpr: 'auto'
    },

    // Responsive трансформации
    responsive: {
      mobile: {
        width: 320,
        crop: 'limit',
        format: 'auto',
        quality: 'auto:good',
        dpr: 'auto'
      },
      tablet: {
        width: 768,
        crop: 'limit',
        format: 'auto',
        quality: 'auto:good',
        dpr: 'auto'
      },
      desktop: {
        width: 1200,
        crop: 'limit',
        format: 'auto',
        quality: 'auto:good',
        dpr: 'auto'
      }
    }
  },

  // Настройки виджета загрузки - PartsBay Brand
  widget: {
    theme: 'minimal',
    language: 'ru',
    sources: ['local', 'camera', 'url'],
    cropping: false,
    multiple: true,
    clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const,
    
    // Дополнительные настройки брендинга
    branding: false,  // Убираем логотип Cloudinary
    showPoweredBy: false,  // Убираем "Powered by Cloudinary"
    
    // Улучшенная настройка размеров
    inline: false,
    defaultSource: 'local',
    maxImageFileSize: 10000000,  // 10MB
    maxVideoFileSize: 100000000, // 100MB
    resourceType: 'auto',
    
    // Превью и кроппинг
    showAdvancedOptions: false,
    showSkipCropButton: false,
    showUploadMoreButton: true,
    
    // Интеграция с прогрессом
    showProgressBar: true,
    queueViewPosition: 'bottom',
    showCompletedButton: true,
    
    // Мобильная оптимизация
    googleApiKey: null,
    searchBySights: false,
    searchByRights: false,
    
    // Стили виджета - PartsBay Brand
    styles: {
      palette: {
        window: '#FFFFFF',
        windowBorder: 'hsl(210 40% 90%)',       // --border из дизайн-системы
        tabIcon: 'hsl(212 50% 18%)',           // --primary (Navy Blue)
        menuIcons: 'hsl(212 50% 18%)',         // --primary (Navy Blue)
        textDark: 'hsl(0 0% 20%)',             // --foreground
        textLight: 'hsl(0 0% 40%)',            // --muted-foreground
        link: 'hsl(199 89% 48%)',              // --accent (Deep Blue)
        action: 'hsl(199 89% 48%)',            // --accent (Deep Blue)
        inactiveTabIcon: 'hsl(0 0% 40%)',      // Приглушенный цвет
        error: 'hsl(0 84% 60%)',               // --destructive
        inProgress: 'hsl(199 89% 48%)',        // --accent (Deep Blue)
        complete: 'hsl(142 71% 45%)',          // --success
        sourceBg: 'hsl(210 40% 98%)'           // --background
      },
      fonts: {
        default: null,
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif": {
          url: null,
          active: true
        }
      },
      
      // Улучшенная анимация и переходы
      frame: {
        background: 'rgba(255, 255, 255, 0.98)',
        border: '1px solid hsl(210 40% 90%)',
        borderRadius: '12px',
        boxShadow: '0 8px 25px -8px hsl(212 50% 18% / 0.15)' // --shadow-elegant
      },
      
      // Кастомные стили для кнопок
      button: {
        primary: {
          background: 'hsl(199 89% 48%)',      // --accent
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '500',
          transition: 'all 0.2s ease'
        },
        secondary: {
          background: 'hsl(210 40% 96%)',      // --secondary
          color: 'hsl(212 50% 18%)',           // --primary
          border: '1px solid hsl(210 40% 90%)',
          borderRadius: '8px',
          fontWeight: '500',
          transition: 'all 0.2s ease'
        }
      }
    },

    // Локализация с улучшенными текстами PartsBay
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

// Генерация URL с трансформациями
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
  
  if (transformation && typeof transformation === 'string' && transformation in CLOUDINARY_CONFIG.transformations) {
    const params = CLOUDINARY_CONFIG.transformations[transformation as TransformationType];
    transformString = Object.entries(params)
      .map(([key, value]) => {
        const shortKey = getShortParam(key);
        return `${shortKey}_${value}`;
      })
      .join(',');
  } else if (typeof transformation === 'string') {
    transformString = transformation;
  }
  
  if (customParams) {
    const customString = Object.entries(customParams)
      .map(([key, value]) => {
        const shortKey = getShortParam(key);
        return `${shortKey}_${value}`;
      })
      .join(',');
    
    transformString = transformString ? `${transformString},${customString}` : customString;
  }
  
  return transformString ? `${baseUrl}/${transformString}/${publicId}` : `${baseUrl}/${publicId}`;
};

// Сокращения параметров Cloudinary
const getShortParam = (param: string): string => {
  const paramMap: Record<string, string> = {
    width: 'w',
    height: 'h',
    crop: 'c',
    format: 'f',
    quality: 'q',
    fetchFormat: 'f',
    dpr: 'dpr',
    blur: 'e_blur',
    gravity: 'g',
    radius: 'r',
    opacity: 'o',
    overlay: 'l',
    effect: 'e',
    angle: 'a',
    border: 'bo',
    color: 'co'
  };
  
  return paramMap[param] || param;
};

// Генерация responsive URL
export const buildResponsiveUrl = (
  publicId: string,
  size: ResponsiveSize,
  customParams?: Record<string, any>
) => {
  const responsiveParams = CLOUDINARY_CONFIG.transformations.responsive[size];
  const allParams = { ...responsiveParams, ...customParams };
  
  return buildCloudinaryUrl(publicId, '', allParams);
};

// Генерация placeholder URL для lazy loading
export const buildPlaceholderUrl = (publicId: string) => {
  return buildCloudinaryUrl(publicId, 'placeholder');
};

// Получение оптимизированного URL
export const getOptimizedImageUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
    quality?: 'auto:low' | 'auto:good' | 'auto:best' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
) => {
  const defaultOptions = {
    format: 'auto' as const,
    quality: 'auto:good' as const,
    crop: 'fit' as const,
    ...options
  };
  
  return buildCloudinaryUrl(publicId, '', defaultOptions);
};

// Валидация upload preset
export const validateUploadPreset = (presetName?: string): { isValid: boolean; error?: string } => {
  if (!presetName || presetName.trim() === '') {
    return {
      isValid: false,
      error: 'Upload preset не указан. Для unsigned загрузки preset обязателен.'
    };
  }
  
  return { isValid: true };
};

// Получение корректного upload preset с fallback
export const getUploadPreset = (type: 'product' | 'productUnsigned' | 'productOptimized' | 'thumbnail' = 'productUnsigned'): string => {
  const preset = CLOUDINARY_CONFIG.uploadPresets[type];
  
  if (!preset || preset.trim() === '') {
    console.warn(`Upload preset '${type}' не настроен, используется fallback`);
    
    // Fallback к productUnsigned, если он настроен
    if (type !== 'productUnsigned' && CLOUDINARY_CONFIG.uploadPresets.productUnsigned) {
      return CLOUDINARY_CONFIG.uploadPresets.productUnsigned;
    }
    
    throw new Error(`Upload preset '${type}' не настроен и fallback недоступен`);
  }
  
  return preset;
};