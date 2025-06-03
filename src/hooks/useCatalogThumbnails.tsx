
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ThumbnailResult {
  success: boolean;
  thumbnailUrl?: string;
  originalSize?: number;
  thumbnailSize?: number;
  compressionRatio?: number;
  quality?: number;
  error?: string;
}

export const useCatalogThumbnails = () => {
  const generateCatalogThumbnail = async (
    imageUrl: string,
    productId: string,
    maxSizeKB: number = 20,
    thumbnailSize: number = 150
  ): Promise<ThumbnailResult> => {
    try {
      console.log(`Generating catalog thumbnail for product ${productId}`);
      
      const { data, error } = await supabase.functions.invoke('compress-catalog-thumbnails', {
        body: {
          imageUrl,
          productId,
          maxSizeKB,
          thumbnailSize
        }
      });

      if (error) {
        console.error('Thumbnail generation function error:', error);
        throw new Error(error.message || 'Failed to generate catalog thumbnail');
      }

      if (!data.success) {
        throw new Error(data.error || 'Thumbnail generation failed');
      }

      console.log('Catalog thumbnail generated successfully:', {
        originalSize: `${(data.originalSize / 1024).toFixed(2)} KB`,
        thumbnailSize: `${(data.thumbnailSize / 1024).toFixed(2)} KB`,
        ratio: `${data.compressionRatio}%`
      });

      return data;
    } catch (error) {
      console.error('Catalog thumbnail generation error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  };

  const generateMultipleThumbnails = async (
    imageUrls: string[],
    productId: string
  ): Promise<(ThumbnailResult & { originalUrl: string })[]> => {
    const results = await Promise.allSettled(
      imageUrls.map(async (url) => {
        const result = await generateCatalogThumbnail(url, productId);
        return { ...result, originalUrl: url };
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          error: result.reason?.message || 'Thumbnail generation failed',
          originalUrl: imageUrls[index]
        };
      }
    });
  };

  return {
    generateCatalogThumbnail,
    generateMultipleThumbnails
  };
};
