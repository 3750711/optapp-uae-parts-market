import { useState, useEffect, useCallback, useMemo } from 'react';
import { extractPublicIdFromUrl } from '@/utils/cloudinaryUtils';
import { getCatalogImageUrl } from '@/utils/previewImageUtils';

interface ImageSource {
  type: 'cloudinary' | 'supabase' | 'placeholder';
  url: string;
  priority: number;
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
  const [failedSources, setFailedSources] = useState<Set<string>>(new Set());

  // Build fallback chain
  const sources = useMemo((): ImageSource[] => {
    const chain: ImageSource[] = [];

    // If we have any Cloudinary data, try Cloudinary first
    const hasCloudinaryData = cloudinaryPublicId || 
      (cloudinaryUrl && cloudinaryUrl.includes('cloudinary.com')) ||
      (src && src.includes('cloudinary.com'));

    if (hasCloudinaryData) {
      // 1. Try Cloudinary with provided publicId (highest priority)
      if (cloudinaryPublicId) {
        chain.push({
          type: 'cloudinary',
          url: getCatalogImageUrl('', cloudinaryPublicId, fallbackSrc),
          priority: 1
        });
      }

      // 2. Try extracting publicId from cloudinaryUrl
      if (cloudinaryUrl && cloudinaryUrl.includes('cloudinary.com')) {
        const extractedId = extractPublicIdFromUrl(cloudinaryUrl);
        if (extractedId && extractedId !== cloudinaryPublicId) {
          chain.push({
            type: 'cloudinary',
            url: getCatalogImageUrl('', extractedId, fallbackSrc),
            priority: 2
          });
        }
      }

      // 3. Try extracting publicId from main src if it's Cloudinary
      if (src && src.includes('cloudinary.com')) {
        const extractedId = extractPublicIdFromUrl(src);
        if (extractedId && extractedId !== cloudinaryPublicId) {
          chain.push({
            type: 'cloudinary',
            url: getCatalogImageUrl('', extractedId, fallbackSrc),
            priority: 3
          });
        }
      }
    }

    // Priority for Supabase URLs (higher priority when no Cloudinary data)
    const supabasePriority = hasCloudinaryData ? 4 : 1;

    // 4. Try Supabase Storage URLs directly
    if (src && !src.includes('cloudinary.com') && src !== fallbackSrc) {
      chain.push({
        type: 'supabase',
        url: src,
        priority: supabasePriority
      });
    }

    // 5. Try original cloudinaryUrl as Supabase if not Cloudinary
    if (cloudinaryUrl && cloudinaryUrl !== src && !cloudinaryUrl.includes('cloudinary.com')) {
      chain.push({
        type: 'supabase',
        url: cloudinaryUrl,
        priority: supabasePriority + 1
      });
    }

    // 6. Final fallback to placeholder
    chain.push({
      type: 'placeholder',
      url: fallbackSrc,
      priority: 99
    });

    // Remove duplicates and filter out failed sources
    const uniqueChain = chain.filter((source, index, arr) => 
      arr.findIndex(s => s.url === source.url) === index &&
      !failedSources.has(source.url)
    ).sort((a, b) => a.priority - b.priority);

    if (process.env.NODE_ENV === 'development') {
      console.log('Image fallback chain:', {
        src,
        cloudinaryPublicId,
        cloudinaryUrl,
        hasCloudinaryData,
        sources: uniqueChain
      });
    }

    return uniqueChain;
  }, [src, cloudinaryPublicId, cloudinaryUrl, fallbackSrc, failedSources]);

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

    testImage(currentSource.url).then((success) => {
      if (success) {
        setIsLoading(false);
        setHasError(false);
      } else {
        // Mark this source as failed
        setFailedSources(prev => new Set(prev).add(currentSource.url));
        
        // Try next source
        if (currentSourceIndex < sources.length - 1) {
          setCurrentSourceIndex(prev => prev + 1);
        } else {
          // All sources failed
          setIsLoading(false);
          setHasError(true);
        }
      }
    });
  }, [currentSource?.url, currentSourceIndex, sources.length, testImage]);

  // Reset when sources change
  useEffect(() => {
    setCurrentSourceIndex(0);
    setFailedSources(new Set());
  }, [src, cloudinaryPublicId, cloudinaryUrl]);

  const retry = useCallback(() => {
    setFailedSources(new Set());
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