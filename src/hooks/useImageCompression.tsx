
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CompressionResult {
  success: boolean;
  compressedUrl?: string;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
  quality?: number;
  dimensions?: { width: number; height: number };
  error?: string;
}

export const useImageCompression = () => {
  const compressImage = async (
    imageUrl: string,
    maxSizeKB: number = 400,
    quality: number = 0.8,
    maxWidth: number = 1920,
    maxHeight: number = 1920
  ): Promise<CompressionResult> => {
    try {
      console.log(`Compressing image: ${imageUrl}`);
      
      const { data, error } = await supabase.functions.invoke('compress-image', {
        body: {
          imageUrl,
          maxSizeKB,
          quality,
          maxWidth,
          maxHeight
        }
      });

      if (error) {
        console.error('Compression function error:', error);
        throw new Error(error.message || 'Failed to compress image');
      }

      if (!data.success) {
        throw new Error(data.error || 'Compression failed');
      }

      console.log('Image compression successful:', {
        originalSize: `${(data.originalSize / 1024).toFixed(2)} KB`,
        compressedSize: `${(data.compressedSize / 1024).toFixed(2)} KB`,
        ratio: `${data.compressionRatio}%`,
        quality: data.quality.toFixed(2),
        dimensions: `${data.dimensions.width}x${data.dimensions.height}`
      });

      toast({
        title: "Изображение сжато",
        description: `Размер уменьшен на ${data.compressionRatio}% (${(data.compressedSize / 1024).toFixed(1)}KB)`,
      });

      return data;
    } catch (error) {
      console.error('Image compression error:', error);
      
      toast({
        title: "Ошибка сжатия",
        description: error instanceof Error ? error.message : "Не удалось сжать изображение",
        variant: "destructive",
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  };

  const compressMultipleImages = async (
    imageUrls: string[],
    maxSizeKB: number = 400,
    maxWidth: number = 1920,
    maxHeight: number = 1920
  ): Promise<(CompressionResult & { originalUrl: string })[]> => {
    const results = await Promise.allSettled(
      imageUrls.map(async (url) => {
        const result = await compressImage(url, maxSizeKB, 0.8, maxWidth, maxHeight);
        return { ...result, originalUrl: url };
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          error: result.reason?.message || 'Compression failed',
          originalUrl: imageUrls[index]
        };
      }
    });
  };

  return {
    compressImage,
    compressMultipleImages
  };
};
