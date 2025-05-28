
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
}

const OptimizedProductImage: React.FC<OptimizedProductImageProps> = ({
  src,
  alt,
  className,
  sizes = "25vw",
  priority = false,
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  // Создаем оптимизированные URL для изображений
  const createOptimizedUrl = (originalUrl: string, width?: number) => {
    if (originalUrl.includes('placeholder.svg')) return originalUrl;
    
    // Если это Supabase URL, добавляем параметры трансформации
    if (originalUrl.includes('supabase')) {
      const url = new URL(originalUrl);
      if (width) {
        url.searchParams.set('width', width.toString());
      }
      url.searchParams.set('quality', '80');
      url.searchParams.set('format', 'webp');
      return url.toString();
    }
    
    return originalUrl;
  };

  // Progressive loading: сначала загружаем низкое качество, потом высокое
  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!src) return;

      try {
        // Сначала пытаемся загрузить превью (низкое качество)
        const previewUrl = createOptimizedUrl(src, 200);
        
        const img = new Image();
        img.onload = () => {
          if (isMounted) {
            setImageSrc(previewUrl);
            setIsLoading(false);
            onLoad?.();
            
            // Затем загружаем полное изображение в фоне
            if (previewUrl !== src) {
              const fullImg = new Image();
              fullImg.onload = () => {
                if (isMounted) {
                  setImageSrc(createOptimizedUrl(src, 800));
                }
              };
              fullImg.src = createOptimizedUrl(src, 800);
            }
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
  }, [src, onLoad, onError]);

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
          objectFit: 'contain'
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
