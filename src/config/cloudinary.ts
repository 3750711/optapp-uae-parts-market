// Cloudinary configuration with PartsBay Brand Theme

export const CLOUDINARY_CONFIG = {
  cloudName: 'dcuziurrb',
  
  // Upload presets for different use cases
  uploadPresets: {
    product: 'partsbay_product',
    productUnsigned: 'product_images_unsigned',
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
    uploadPreset: 'product_images_unsigned',
    multiple: true,
    maxFiles: 50,
    maxFileSize: 10000000,
    sources: ['local'],
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
    language: 'en',
    sources: ['local'],
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
    showUploadMoreButton: false,
    showProgressBar: true,
    queueViewPosition: 'bottom',
    showCompletedButton: true,
    
    // Mobile optimization
    googleApiKey: null,
    searchBySights: false,
    searchByRights: false,
    
    // PartsBay Brand Styling with Mobile Optimization
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
        backdropFilter: "blur(8px)",
        // Mobile optimization
        touchAction: "manipulation",
        userSelect: "none",
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none"
      },
      dropArea: {
        display: "none"
      },
      // Mobile-specific button styles
      button: {
        minHeight: "48px",
        padding: "14px 24px",
        fontSize: "16px",
        borderRadius: "12px",
        touchAction: "manipulation"
      },
      // Progress bar mobile optimization
      progressBar: {
        height: "6px",
        borderRadius: "3px"
      },
      // Text sizing for mobile readability
      text: {
        fontSize: "16px",
        lineHeight: "1.5"
      },
      title: {
        fontSize: "20px",
        lineHeight: "1.4"
      }
    },

    // Simple English localization
    text: {
      en: {
        'local.browse': 'Choose Files',
        'local.dd_title_single': 'Drop your photo here',
        'local.dd_title_multi': 'Drop your photos here',
        'queue.title': 'Uploading photos',
        'queue.title_uploading_with_counter': 'Uploading {{num}} photos',
        'queue.title_uploading': 'Uploading photo',
        'queue.mini_title': 'Uploaded',
        'queue.mini_title_uploading': 'Uploading...',
        'done.title': 'Upload complete',
        'local.success': 'Photos uploaded successfully',
        'progress.uploading': 'Uploading your photos...',
        'or': 'or',
        'menu.close': 'Close',
        'menu.back': 'Back'
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

// Widget sources utilities
export const getWidgetSources = (isMobile: boolean): string[] => {
  return ['local'];
};

export const getWidgetUXConfig = (isMobile: boolean) => {
  const baseConfig = {
    inline: false,
    queueViewPosition: isMobile ? 'bottom' : 'top',
    showAdvancedOptions: false,
    cropping: false,
    branding: false,
    showPoweredBy: false,
    defaultSource: 'local',
    preBatch: true,
  };

  // Mobile-specific optimizations
  if (isMobile) {
    return {
      ...baseConfig,
      // Touch-friendly settings
      theme: 'minimal',
      showProgressBar: true,
      showCompletedButton: true,
      showUploadMoreButton: false,
      // Performance optimizations
      maxImageFileSize: 8000000, // 8MB for mobile (vs 10MB desktop)
      clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
      quality: 'auto:good',
      // Queue optimization
      queueViewPosition: 'bottom',
      thumbnailTransformation: { width: 60, height: 60, crop: 'fill' },
      // Mobile UX improvements
      prepareOnDrop: false, // Reduce processing on mobile
      autoMinimize: true,
      closeWidget: true
    };
  }

  return baseConfig;
};