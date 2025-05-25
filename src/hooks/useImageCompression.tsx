
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CompressionResult {
  success: boolean;
  compressedUrl?: string;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
  quality?: number;
  error?: string;
}

export const useImageCompression = () => {
  const compressOrderImage = async (
    imageUrl: string,
    orderId: string,
    maxSizeKB: number = 250,
    quality: number = 0.8
  ): Promise<CompressionResult> => {
    try {
      console.log(`Compressing image for order ${orderId}:`, imageUrl);
      
      const { data, error } = await supabase.functions.invoke('compress-order-images', {
        body: {
          imageUrl,
          orderId,
          maxSizeKB,
          quality
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
        quality: data.quality.toFixed(2)
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
    orderId: string,
    maxSizeKB: number = 250
  ): Promise<(CompressionResult & { originalUrl: string })[]> => {
    const results = await Promise.allSettled(
      imageUrls.map(async (url) => {
        const result = await compressOrderImage(url, orderId, maxSizeKB);
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
    compressOrderImage,
    compressMultipleImages
  };
};
