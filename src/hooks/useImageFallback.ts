import { useState, useEffect, useCallback, useMemo } from 'react';
import { getCatalogImageUrl } from '@/utils/previewImageUtils';

interface ImageSource {
  type: 'cloudinary' | 'supabase' | 'placeholder';
  url: string;
}

interface UseImageFallbackProps {
  src: string;
  cloudinaryPublicId?: string | null;
  cloudinaryUrl?: string | null;
  fallbackSrc?: string;
  size?: 'thumbnail' | 'card' | 'detail';
}

interface UseImageFallbackReturn {
  currentSrc: string;
  isLoading: boolean;
  hasError: boolean;
  sourceType: 'cloudinary' | 'supabase' | 'placeholder';
  retry: () => void;
}

export const useImageFallback = ({
  src,
  cloudinaryPublicId,
  cloudinaryUrl,
  fallbackSrc = '/placeholder.svg',
  size = 'card'
}: UseImageFallbackProps): UseImageFallbackReturn => {
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Simple fallback chain: Cloudinary → Supabase → Placeholder
  const sources = useMemo((): ImageSource[] => {
    const chain: ImageSource[] = [];

    // 1. Try Cloudinary if we have a public ID
    if (cloudinaryPublicId) {
      const cloudinaryUrl = getCatalogImageUrl('', cloudinaryPublicId, fallbackSrc, '');
      chain.push({
        type: 'cloudinary',
        url: cloudinaryUrl
      });
    }

    // 2. Try Supabase URL directly if it exists and isn't the fallback
    if (src && src !== fallbackSrc) {
      chain.push({
        type: 'supabase',
        url: src
      });
    }

    // 3. Final fallback to placeholder
    chain.push({
      type: 'placeholder',
      url: fallbackSrc
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Simple image fallback:', {
        src,
        cloudinaryPublicId,
        sources: chain.map(s => ({ type: s.type, url: s.url }))
      });
    }

    return chain;
  }, [src, cloudinaryPublicId, fallbackSrc]);

  const currentSource = sources[currentSourceIndex] || sources[sources.length - 1];

  // Test image loading
  const testImage = useCallback((url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }, []);

  // Load current image
  useEffect(() => {
    if (!currentSource?.url) return;

    setIsLoading(true);
    setHasError(false);

    if (process.env.NODE_ENV === 'development') {
      console.log(`Trying image source: ${currentSource.type} - ${currentSource.url}`);
    }

    testImage(currentSource.url).then((success) => {
      if (success) {
        setIsLoading(false);
        setHasError(false);
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Image loaded successfully: ${currentSource.type}`);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log(`❌ Image failed to load: ${currentSource.type} - ${currentSource.url}`);
        }
        
        // Try next source
        if (currentSourceIndex < sources.length - 1) {
          setCurrentSourceIndex(prev => prev + 1);
        } else {
          // All sources failed
          setIsLoading(false);
          setHasError(true);
          if (process.env.NODE_ENV === 'development') {
            console.log('❌ All image sources failed');
          }
        }
      }
    });
  }, [currentSource?.url, currentSourceIndex, sources.length, testImage]);

  // Reset when sources change
  useEffect(() => {
    setCurrentSourceIndex(0);
  }, [src, cloudinaryPublicId, cloudinaryUrl]);

  const retry = useCallback(() => {
    setCurrentSourceIndex(0);
  }, []);

  return {
    currentSrc: currentSource?.url || fallbackSrc,
    isLoading,
    hasError,
    sourceType: currentSource?.type || 'placeholder',
    retry
  };
};