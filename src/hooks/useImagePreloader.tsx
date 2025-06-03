
import { useEffect, useCallback } from 'react';

interface ImagePreloaderOptions {
  enabled?: boolean;
  preloadDistance?: number;
  maxConcurrent?: number;
  catalogMode?: boolean; // Новый режим для каталога
}

export const useImagePreloader = (
  images: string[], 
  options: ImagePreloaderOptions = {}
) => {
  const { 
    enabled = true, 
    preloadDistance = 10,
    maxConcurrent = 3,
    catalogMode = false
  } = options;

  // Создаем оптимизированный URL для предзагрузки каталожных изображений
  const createPreloadUrl = useCallback((src: string): string => {
    if (!src || src === '/placeholder.svg') {
      return src;
    }

    if (catalogMode && src.includes('supabase')) {
      const url = new URL(src);
      url.searchParams.set('width', '150');
      url.searchParams.set('height', '150');
      url.searchParams.set('quality', '45');
      url.searchParams.set('format', 'webp');
      url.searchParams.set('resize', 'cover');
      return url.toString();
    }

    return src;
  }, [catalogMode]);

  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const optimizedSrc = createPreloadUrl(src);
      
      if (!optimizedSrc || optimizedSrc === '/placeholder.svg') {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => {
        console.warn(`Failed to preload image: ${optimizedSrc}`);
        resolve(); // Не блокируем другие изображения при ошибке
      };
      
      // Устанавливаем размеры для каталожного режима
      if (catalogMode) {
        img.width = 150;
        img.height = 150;
      }
      
      img.src = optimizedSrc;
    });
  }, [createPreloadUrl, catalogMode]);

  const preloadImages = useCallback(async (imagesToLoad: string[]) => {
    if (!enabled || imagesToLoad.length === 0) return;

    // Фильтруем и оптимизируем список изображений
    const validImages = imagesToLoad
      .filter(src => src && src !== '/placeholder.svg')
      .slice(0, preloadDistance); // Ограничиваем количество

    if (validImages.length === 0) return;

    // Группируем изображения для параллельной загрузки
    const chunkSize = catalogMode ? Math.min(maxConcurrent * 2, 8) : maxConcurrent;
    const chunks = [];
    for (let i = 0; i < validImages.length; i += chunkSize) {
      chunks.push(validImages.slice(i, i + chunkSize));
    }

    // Загружаем по частям с небольшой задержкой между чанками
    for (const [index, chunk] of chunks.entries()) {
      try {
        // Добавляем небольшую задержку для снижения нагрузки
        if (index > 0 && catalogMode) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        await Promise.allSettled(
          chunk.map(src => preloadImage(src))
        );
      } catch (error) {
        console.warn('Some images failed to preload in chunk:', error);
      }
    }

    console.log(`Preloaded ${validImages.length} images in ${catalogMode ? 'catalog' : 'detail'} mode`);
  }, [enabled, maxConcurrent, preloadDistance, preloadImage, catalogMode]);

  useEffect(() => {
    if (images.length > 0) {
      // Предзагружаем ближайшие изображения
      const imagesToPreload = images.slice(0, preloadDistance);
      preloadImages(imagesToPreload);
    }
  }, [images, preloadDistance, preloadImages]);

  return { preloadImages };
};
