
import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedProductImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  catalogMode?: boolean; // Новый режим для каталога
  thumbnailUrl?: string; // URL каталожного превью
}

const OptimizedProductImage: React.FC<OptimizedProductImageProps> = ({
  src,
  alt,
  className,
  sizes = "25vw",
  priority = false,
  onLoad,
  onError,
  catalogMode = false,
  thumbnailUrl
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  // Создаем оптимизированные URL для изображений
  const createOptimizedUrl = (originalUrl: string, width?: number, quality?: number) => {
    if (originalUrl.includes('placeholder.svg')) return originalUrl;
    
    // Для каталожного режима используем каталожное превью если доступно
    if (catalogMode && thumbnailUrl) {
      return thumbnailUrl;
    }
    
    // Если это Supabase URL, добавляем параметры трансформации
    if (originalUrl.includes('supabase')) {
      const url = new URL(originalUrl);
      
      if (catalogMode) {
        // Для каталога: маленькие превью до 20KB
        url.searchParams.set('width', '150');
        url.searchParams.set('height', '150');
        url.searchParams.set('quality', '45');
        url.searchParams.set('format', 'webp');
        url.searchParams.set('resize', 'cover');
      } else {
        // Для детальных страниц: сжатие до 400KB
        if (width) {
          url.searchParams.set('width', width.toString());
        }
        url.searchParams.set('quality', (quality || 80).toString());
        url.searchParams.set('format', 'webp');
      }
      
      return url.toString();
    }
    
    return originalUrl;
  };

  // Загрузка изображения
  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!src) return;

      try {
        let imageUrl;
        
        if (catalogMode) {
          // Для каталога загружаем только каталожное превью
          imageUrl = createOptimizedUrl(src, 150, 45);
        } else {
          // Для детальных страниц используем прогрессивную загрузку
          // Сначала превью, потом полное изображение
          const previewUrl = createOptimizedUrl(src, 400, 60);
          
          const img = new Image();
          img.onload = () => {
            if (isMounted) {
              setImageSrc(previewUrl);
              setIsLoading(false);
              onLoad?.();
              
              // Затем загружаем полное изображение в фоне (до 400KB)
              const fullImg = new Image();
              fullImg.onload = () => {
                if (isMounted) {
                  setImageSrc(createOptimizedUrl(src, 800, 80));
                }
              };
              fullImg.src = createOptimizedUrl(src, 800, 80);
            }
          };
          
          img.onerror = () => {
            if (isMounted) {
              setHasError(true);
              setIsLoading(false);
              setImageSrc('/placeholder.svg');
              onError?.();
            }
          };
          
          img.src = previewUrl;
          return;
        }
        
        // Простая загрузка для каталожного режима
        const img = new Image();
        img.onload = () => {
          if (isMounted) {
            setImageSrc(imageUrl);
            setIsLoading(false);
            onLoad?.();
          }
        };
        
        img.onerror = () => {
          if (isMounted) {
            setHasError(true);
            setIsLoading(false);
            setImageSrc('/placeholder.svg');
            onError?.();
          }
        };
        
        img.src = imageUrl;
      } catch (error) {
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
          setImageSrc('/placeholder.svg');
          onError?.();
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [src, onLoad, onError, catalogMode, thumbnailUrl]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Actual image */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
      
      {/* Error state */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Изображение недоступно</div>
        </div>
      )}
    </div>
  );
};

export default OptimizedProductImage;
