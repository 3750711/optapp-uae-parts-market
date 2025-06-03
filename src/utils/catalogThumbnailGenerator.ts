
import { useCatalogThumbnails } from "@/hooks/useCatalogThumbnails";

export class CatalogThumbnailGenerator {
  private thumbnailHook = useCatalogThumbnails();

  /**
   * Автоматически генерирует каталожные превью для продукта
   * @param productId ID продукта
   * @param imageUrls Массив URL изображений продукта
   * @returns Массив URL каталожных превью
   */
  async generateProductThumbnails(
    productId: string, 
    imageUrls: string[]
  ): Promise<string[]> {
    const thumbnailUrls: string[] = [];
    
    try {
      console.log(`Generating catalog thumbnails for product ${productId}`);
      
      // Генерируем превью для каждого изображения
      for (const imageUrl of imageUrls) {
        try {
          const result = await this.thumbnailHook.generateCatalogThumbnail(
            imageUrl,
            productId,
            20, // 20KB максимум
            150 // 150px размер
          );
          
          if (result.success && result.thumbnailUrl) {
            thumbnailUrls.push(result.thumbnailUrl);
            console.log(`Generated thumbnail: ${result.thumbnailUrl}`);
          } else {
            console.warn(`Failed to generate thumbnail for ${imageUrl}:`, result.error);
            // В случае ошибки используем оригинальный URL
            thumbnailUrls.push(imageUrl);
          }
        } catch (error) {
          console.error(`Error generating thumbnail for ${imageUrl}:`, error);
          // В случае ошибки используем оригинальный URL
          thumbnailUrls.push(imageUrl);
        }
      }
      
      console.log(`Generated ${thumbnailUrls.length} thumbnails for product ${productId}`);
      return thumbnailUrls;
    } catch (error) {
      console.error(`Error in thumbnail generation process for product ${productId}:`, error);
      // В случае общей ошибки возвращаем оригинальные URL
      return imageUrls;
    }
  }

  /**
   * Генерирует превью для одного изображения
   * @param imageUrl URL изображения
   * @param productId ID продукта
   * @returns URL каталожного превью или оригинальный URL при ошибке
   */
  async generateSingleThumbnail(
    imageUrl: string,
    productId: string
  ): Promise<string> {
    try {
      const result = await this.thumbnailHook.generateCatalogThumbnail(
        imageUrl,
        productId,
        20,
        150
      );
      
      if (result.success && result.thumbnailUrl) {
        return result.thumbnailUrl;
      } else {
        console.warn(`Failed to generate single thumbnail:`, result.error);
        return imageUrl;
      }
    } catch (error) {
      console.error(`Error generating single thumbnail:`, error);
      return imageUrl;
    }
  }
}

// Экспортируем экземпляр для использования
export const catalogThumbnailGenerator = new CatalogThumbnailGenerator();
