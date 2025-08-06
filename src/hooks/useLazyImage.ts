import { useEffect, useRef, useState } from 'react';

interface UseLazyImageProps {
  src: string;
  fallbackSrc?: string;
  threshold?: number;
}

export const useLazyImage = ({ src, fallbackSrc = '/placeholder.svg', threshold = 0.1 }: UseLazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  useEffect(() => {
    if (isInView && !isLoaded && !hasError) {
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setHasError(true);
      img.src = src;
    }
  }, [isInView, src, isLoaded, hasError]);

  const imageSrc = hasError ? fallbackSrc : (isLoaded ? src : fallbackSrc);

  return {
    imgRef,
    imageSrc,
    isLoaded,
    isInView,
    hasError,
  };
};