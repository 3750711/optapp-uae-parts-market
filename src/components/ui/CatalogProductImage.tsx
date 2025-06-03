
import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CatalogProductImageProps {
  src: string;
  alt: string;
  className?: string;
  thumbnailUrl?: string; // URL каталожного превью
  lazy?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const CatalogProductImage: React.FC<CatalogProductImageProps> = ({
  src,
  alt,
  className,
  thumbnailUrl,
  lazy = true,
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isVisible, setIsVisible] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

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
        rootMargin: '50px', // Начинаем загрузку за 50px до появления
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

  // Создаем оптимизированный URL для каталога
  const createCatalogUrl = (originalUrl: string) => {
    if (originalUrl.includes('placeholder.svg')) return originalUrl;
    
    // Используем каталожное превью если доступно
    if (thumbnailUrl) {
      return thumbnailUrl;
    }
    
    // Иначе создаем оптимизированный URL для Supabase
    if (originalUrl.includes('supabase')) {
      const url = new URL(originalUrl);
      url.searchParams.set('width', '150');
      url.searchParams.set('height', '150');
      url.searchParams.set('quality', '45');
      url.searchParams.set('format', 'webp');
      url.searchParams.set('resize', 'cover');
      return url.toString();
    }
    
    return originalUrl;
  };

  // Загрузка изображения при становлении видимым
  useEffect(() => {
    if (!isVisible || !src) return;

    let isMounted = true;

    const loadImage = async () => {
      try {
        const optimizedUrl = createCatalogUrl(src);
        
        const img = new Image();
        img.onload = () => {
          if (isMounted) {
            setImageSrc(optimizedUrl);
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
        
        img.src = optimizedUrl;
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
  }, [isVisible, src, thumbnailUrl, onLoad, onError]);

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
          src={imageSrc}
          alt={alt}
          className={cn(
            "transition-opacity duration-300 w-full h-full object-cover",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          loading="lazy"
          decoding="async"
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

export default CatalogProductImage;
