// Конфигурация Cloudinary для загрузки изображений товаров
export const CLOUDINARY_CONFIG = {
  cloudName: 'dcuziurrb',
  
  // Upload presets для разных типов загрузок
  uploadPresets: {
    product: 'ml_default', // Основной preset для изображений товаров
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
      fetchFormat: 'auto'
    },
    
    // Средний размер для детального просмотра
    medium: {
      width: 500,
      height: 500,
      crop: 'fit',
      format: 'auto',
      quality: 'auto:good',
      fetchFormat: 'auto'
    },
    
    // Большой размер для полноэкранного просмотра
    large: {
      width: 1200,
      height: 1200,
      crop: 'fit',
      format: 'auto',
      quality: 'auto:good',
      fetchFormat: 'auto'
    },
    
    // Сверхмалый размер для lazy loading
    placeholder: {
      width: 50,
      height: 50,
      crop: 'fill',
      format: 'auto',
      quality: 'auto:low',
      blur: 1000
    },

    // Responsive трансформации
    responsive: {
      mobile: {
        width: 320,
        crop: 'fit',
        format: 'auto',
        quality: 'auto:good'
      },
      tablet: {
        width: 768,
        crop: 'fit',
        format: 'auto',
        quality: 'auto:good'
      },
      desktop: {
        width: 1200,
        crop: 'fit',
        format: 'auto',
        quality: 'auto:good'
      }
    }
  },

  // Настройки виджета загрузки
  widget: {
    theme: 'minimal',
    language: 'ru',
    sources: ['local', 'camera', 'url'],
    showAdvancedOptions: false,
    cropping: false,
    multiple: true,
    clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const,
    
    // Стили виджета
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
    },

    // Локализация
    text: {
      ru: {
        'local.browse': 'Выбрать файлы',
        'local.dd_title_single': 'Перетащите изображение сюда',
        'local.dd_title_multi': 'Перетащите изображения сюда',
        'camera.capture': 'Сделать фото',
        'camera.cancel': 'Отмена',
        'camera.take_pic': 'Снимок',
        'camera.explanation': 'Убедитесь, что камера включена',
        'upload_tabs.url': 'URL',
        'upload_tabs.file': 'Файл',
        'queue.title': 'Очередь загрузки',
        'queue.title_uploading_with_counter': 'Загружается {{num}} файлов',
        'queue.title_uploading': 'Загружается файл',
        'queue.mini_title': 'Загружено',
        'queue.mini_title_uploading': 'Загружается',
        'done.title': 'Готово!'
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