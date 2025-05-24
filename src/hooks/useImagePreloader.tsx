
import { useEffect, useCallback } from 'react';

interface ImagePreloaderOptions {
  enabled?: boolean;
  preloadDistance?: number;
  maxConcurrent?: number;
}

export const useImagePreloader = (
  images: string[], 
  options: ImagePreloaderOptions = {}
) => {
  const { 
    enabled = true, 
    preloadDistance = 10,
    maxConcurrent = 3
  } = options;

  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!src || src === '/placeholder.svg') {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }, []);

  const preloadImages = useCallback(async (imagesToLoad: string[]) => {
    if (!enabled || imagesToLoad.length === 0) return;

    // Группируем изображения для параллельной загрузки
    const chunks = [];
    for (let i = 0; i < imagesToLoad.length; i += maxConcurrent) {
      chunks.push(imagesToLoad.slice(i, i + maxConcurrent));
    }

    // Загружаем по частям
    for (const chunk of chunks) {
      try {
        await Promise.allSettled(
          chunk.map(src => preloadImage(src))
        );
      } catch (error) {
        console.warn('Some images failed to preload:', error);
      }
    }
  }, [enabled, maxConcurrent, preloadImage]);

  useEffect(() => {
    if (images.length > 0) {
      // Предзагружаем ближайшие изображения
      const imagesToPreload = images.slice(0, preloadDistance);
      preloadImages(imagesToPreload);
    }
  }, [images, preloadDistance, preloadImages]);

  return { preloadImages };
};
