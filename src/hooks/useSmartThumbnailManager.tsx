
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useCatalogThumbnails } from "./useCatalogThumbnails";

interface ThumbnailGenerationResult {
  imageId: string;
  success: boolean;
  thumbnailUrl?: string;
  error?: string;
}

interface ImageToProcess {
  imageId: string;
  productId: string;
  imageUrl: string;
  isPrimary: boolean;
}

export const useSmartThumbnailManager = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [currentQueue, setCurrentQueue] = useState<ImageToProcess[]>([]);
  const processedImagesRef = useRef(new Set<string>());
  const { generateCatalogThumbnail } = useCatalogThumbnails();

  // Получаем изображения, которым нужны превью
  const getImagesNeedingPreviews = useCallback(async (limit: number = 20): Promise<ImageToProcess[]> => {
    try {
      const { data, error } = await supabase.rpc('get_products_needing_previews', {
        p_limit: limit
      });

      if (error) {
        console.error('Error fetching images needing previews:', error);
        return [];
      }

      return data?.map((item: any) => ({
        imageId: item.image_id,
        productId: item.product_id,
        imageUrl: item.image_url,
        isPrimary: item.is_primary
      })) || [];
    } catch (error) {
      console.error('Error in getImagesNeedingPreviews:', error);
      return [];
    }
  }, []);

  // Обновляем preview_url в базе данных
  const updateImagePreview = useCallback(async (imageId: string, previewUrl: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('update_product_image_preview', {
        p_image_id: imageId,
        p_preview_url: previewUrl
      });

      if (error) {
        console.error('Error updating image preview:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error in updateImagePreview:', error);
      return false;
    }
  }, []);

  // Генерируем превью для одного изображения
  const generateImageThumbnail = useCallback(async (image: ImageToProcess): Promise<ThumbnailGenerationResult> => {
    try {
      console.log(`Generating thumbnail for image ${image.imageId} (product ${image.productId})`);
      
      const result = await generateCatalogThumbnail(
        image.imageUrl,
        image.productId,
        20, // 20KB максимум
        150 // 150px размер
      );

      if (result.success && result.thumbnailUrl) {
        // Обновляем базу данных
        const updateSuccess = await updateImagePreview(image.imageId, result.thumbnailUrl);
        
        if (updateSuccess) {
          console.log(`Successfully generated and saved thumbnail for image ${image.imageId}`);
          return {
            imageId: image.imageId,
            success: true,
            thumbnailUrl: result.thumbnailUrl
          };
        } else {
          console.error(`Failed to save thumbnail URL for image ${image.imageId}`);
          return {
            imageId: image.imageId,
            success: false,
            error: 'Failed to save thumbnail URL'
          };
        }
      } else {
        console.error(`Failed to generate thumbnail for image ${image.imageId}:`, result.error);
        return {
          imageId: image.imageId,
          success: false,
          error: result.error || 'Thumbnail generation failed'
        };
      }
    } catch (error) {
      console.error(`Error generating thumbnail for image ${image.imageId}:`, error);
      return {
        imageId: image.imageId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [generateCatalogThumbnail, updateImagePreview]);

  // Обрабатываем очередь изображений
  const processImageQueue = useCallback(async (images: ImageToProcess[]) => {
    if (images.length === 0) return;

    setIsProcessing(true);
    setProcessedCount(0);
    setTotalToProcess(images.length);
    setCurrentQueue(images);

    console.log(`Starting batch processing of ${images.length} images`);

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      // Пропускаем уже обработанные изображения
      if (processedImagesRef.current.has(image.imageId)) {
        setProcessedCount(prev => prev + 1);
        continue;
      }

      try {
        const result = await generateImageThumbnail(image);
        
        if (result.success) {
          processedImagesRef.current.add(image.imageId);
        }
        
        setProcessedCount(prev => prev + 1);
        
        // Небольшая пауза между обработкой изображений
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing image ${image.imageId}:`, error);
        setProcessedCount(prev => prev + 1);
      }
    }

    console.log(`Completed batch processing. Processed: ${images.length} images`);
    setIsProcessing(false);
    setCurrentQueue([]);
  }, [generateImageThumbnail]);

  // Автоматически обрабатываем изображения при инициализации
  const startAutoProcessing = useCallback(async (batchSize: number = 10) => {
    if (isProcessing) {
      console.log('Processing already in progress, skipping...');
      return;
    }

    const imagesToProcess = await getImagesNeedingPreviews(batchSize);
    
    if (imagesToProcess.length > 0) {
      console.log(`Found ${imagesToProcess.length} images that need previews`);
      await processImageQueue(imagesToProcess);
    } else {
      console.log('No images need preview generation');
    }
  }, [isProcessing, getImagesNeedingPreviews, processImageQueue]);

  // Проверяем и генерируем превью для конкретного изображения
  const checkAndGeneratePreview = useCallback(async (
    imageUrl: string, 
    productId: string, 
    imageId?: string
  ): Promise<string> => {
    // Если уже обрабатывается, возвращаем оригинальный URL
    if (imageId && processedImagesRef.current.has(imageId)) {
      return imageUrl;
    }

    // Проверяем размер изображения (примерная проверка по URL)
    const shouldGenerate = !imageUrl.includes('catalog-thumbnails') && 
                          !imageUrl.includes('width=150') &&
                          imageUrl !== '/placeholder.svg';

    if (shouldGenerate && imageId) {
      try {
        const result = await generateImageThumbnail({
          imageId,
          productId,
          imageUrl,
          isPrimary: false
        });

        if (result.success && result.thumbnailUrl) {
          processedImagesRef.current.add(imageId);
          return result.thumbnailUrl;
        }
      } catch (error) {
        console.error('Error in checkAndGeneratePreview:', error);
      }
    }

    return imageUrl;
  }, [generateImageThumbnail]);

  return {
    // Состояние
    isProcessing,
    processedCount,
    totalToProcess,
    currentQueue,
    
    // Методы
    startAutoProcessing,
    checkAndGeneratePreview,
    getImagesNeedingPreviews,
    processImageQueue,
    
    // Статистика
    progressPercentage: totalToProcess > 0 ? Math.round((processedCount / totalToProcess) * 100) : 0,
    hasImagesInQueue: currentQueue.length > 0
  };
};
