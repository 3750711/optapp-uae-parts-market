
import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSmartThumbnailManager } from "@/hooks/useSmartThumbnailManager";

interface SmartCatalogImageProps {
  src: string;
  alt: string;
  className?: string;
  productId: string;
  imageId?: string;
  lazy?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const SmartCatalogImage: React.FC<SmartCatalogImageProps> = ({
  src,
  alt,
  className,
  productId,
  imageId,
  lazy = true,
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [optimizedSrc, setOptimizedSrc] = useState<string>(src);
  const [isVisible, setIsVisible] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { checkAndGeneratePreview } = useSmartThumbnailManager();

  // Intersection Observer для ленивой загрузки
  useEffect(() => {
    if (!lazy || isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Начинаем загрузку за 100px до появления
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazy, isVisible]);

  // Умная оптимизация изображения
  useEffect(() => {
    if (!isVisible || !src || src === '/placeholder.svg') return;

    let isMounted = true;

    const optimizeImage = async () => {
      try {
        // Проверяем, является ли изображение уже оптимизированным
        const isAlreadyOptimized = src.includes('catalog-thumbnails') || 
                                 src.includes('width=150') ||
                                 src.includes('quality=45');

        if (isAlreadyOptimized) {
          // Используем уже оптимизированное изображение
          if (isMounted) {
            setOptimizedSrc(src);
          }
        } else {
          // Пытаемся получить или создать оптимизированную версию
          const optimized = await checkAndGeneratePreview(src, productId, imageId);
          
          if (isMounted) {
            setOptimizedSrc(optimized);
          }
        }
      } catch (error) {
        console.error('Error optimizing image:', error);
        if (isMounted) {
          setOptimizedSrc(src); // Fallback к оригиналу
        }
      }
    };

    optimizeImage();

    return () => {
      isMounted = false;
    };
  }, [isVisible, src, productId, imageId, checkAndGeneratePreview]);

  const handleImageLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
    setOptimizedSrc('/placeholder.svg');
    onError?.();
  };

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden bg-gray-100", className)}>
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Actual image */}
      {isVisible && (
        <img
          src={optimizedSrc}
          alt={alt}
          className={cn(
            "transition-opacity duration-300 w-full h-full object-cover",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          loading="lazy"
          decoding="async"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
      
      {/* Error state */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="text-gray-400 text-xs text-center">
            Изображение недоступно
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartCatalogImage;
