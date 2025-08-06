import { useEffect, useState } from 'react';

interface UseImagePreloaderProps {
  images: string[];
  priority?: number; // Number of images to preload immediately
}

export const useImagePreloader = ({ images, priority = 2 }: UseImagePreloaderProps) => {
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (images.length === 0) return;

    // Preload priority images immediately
    const priorityImages = images.slice(0, priority);
    
    priorityImages.forEach((src) => {
      if (!preloadedImages.has(src) && !loadingImages.has(src)) {
        setLoadingImages(prev => new Set(prev).add(src));
        
        const img = new Image();
        img.onload = () => {
          setPreloadedImages(prev => new Set(prev).add(src));
          setLoadingImages(prev => {
            const newSet = new Set(prev);
            newSet.delete(src);
            return newSet;
          });
        };
        img.onerror = () => {
          setLoadingImages(prev => {
            const newSet = new Set(prev);
            newSet.delete(src);
            return newSet;
          });
        };
        img.src = src;
      }
    });
  }, [images, priority, preloadedImages, loadingImages]);

  const preloadImage = (src: string) => {
    if (!preloadedImages.has(src) && !loadingImages.has(src)) {
      setLoadingImages(prev => new Set(prev).add(src));
      
      const img = new Image();
      img.onload = () => {
        setPreloadedImages(prev => new Set(prev).add(src));
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
      };
      img.onerror = () => {
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
      };
      img.src = src;
    }
  };

  return {
    preloadedImages,
    loadingImages,
    preloadImage,
    isPreloaded: (src: string) => preloadedImages.has(src),
    isLoading: (src: string) => loadingImages.has(src),
  };
};