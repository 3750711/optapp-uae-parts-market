
import { supabase } from "@/integrations/supabase/client";
import { generateProductPreview } from "./previewGenerator";

export interface PreviewSyncResult {
  totalProcessed: number;
  updated: number;
  errors: string[];
  details: Array<{
    id: string;
    lot_number: number;
    title: string;
    action: 'updated' | 'skipped' | 'error';
    message: string;
  }>;
}

// Синхронизация preview_image_url с актуальными изображениями товара
export const syncProductPreviews = async (productIds?: string[]): Promise<PreviewSyncResult> => {
  const result: PreviewSyncResult = {
    totalProcessed: 0,
    updated: 0,
    errors: [],
    details: []
  };

  try {
    console.log('🔄 Starting preview sync process...');
    
    // Получаем товары для обработки
    let query = supabase
      .from('products')
      .select(`
        id,
        lot_number,
        title,
        preview_image_url,
        cloudinary_public_id,
        product_images(url, is_primary)
      `)
      .order('lot_number');

    if (productIds && productIds.length > 0) {
      query = query.in('id', productIds);
    }

    const { data: products, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    if (!products || products.length === 0) {
      console.log('⚠️ No products found to process');
      return result;
    }

    console.log(`📦 Processing ${products.length} products...`);

    for (const product of products) {
      result.totalProcessed++;
      
      try {
        // Получаем primary изображение или первое доступное
        const primaryImage = product.product_images?.find(img => img.is_primary) || 
                           product.product_images?.[0];

        if (!primaryImage) {
          result.details.push({
            id: product.id,
            lot_number: product.lot_number,
            title: product.title,
            action: 'skipped',
            message: 'No images available'
          });
          continue;
        }

        // Проверяем, нужно ли обновлять preview_image_url
        const needsUpdate = !product.preview_image_url || 
                           !product.preview_image_url.includes(primaryImage.url.split('/').pop() || '');

        if (!needsUpdate) {
          result.details.push({
            id: product.id,
            lot_number: product.lot_number,
            title: product.title,
            action: 'skipped',
            message: 'Preview URL already matches primary image'
          });
          continue;
        }

        // Генерируем новый preview
        console.log(`🎨 Generating preview for product ${product.lot_number}: ${product.title}`);
        
        const previewResult = await generateProductPreview(primaryImage.url, product.id);

        if (previewResult.success && previewResult.previewUrl) {
          result.updated++;
          result.details.push({
            id: product.id,
            lot_number: product.lot_number,
            title: product.title,
            action: 'updated',
            message: `Preview updated successfully (${Math.round((previewResult.previewSize || 0) / 1024)}KB)`
          });
          
          console.log(`✅ Updated preview for lot ${product.lot_number}`);
        } else {
          const errorMsg = previewResult.error || 'Unknown error during preview generation';
          result.errors.push(`Lot ${product.lot_number}: ${errorMsg}`);
          result.details.push({
            id: product.id,
            lot_number: product.lot_number,
            title: product.title,
            action: 'error',
            message: errorMsg
          });
          
          console.error(`❌ Failed to update preview for lot ${product.lot_number}: ${errorMsg}`);
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Lot ${product.lot_number}: ${errorMsg}`);
        result.details.push({
          id: product.id,
          lot_number: product.lot_number,
          title: product.title,
          action: 'error',
          message: errorMsg
        });
        
        console.error(`❌ Error processing lot ${product.lot_number}:`, error);
      }
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`General error: ${errorMsg}`);
    console.error('💥 Preview sync failed:', error);
  }

  console.log('📊 Preview sync completed:', {
    totalProcessed: result.totalProcessed,
    updated: result.updated,
    errors: result.errors.length
  });

  return result;
};

// Синхронизация конкретного товара по лот номеру
export const syncProductPreviewByLot = async (lotNumber: number): Promise<PreviewSyncResult> => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('id')
      .eq('lot_number', lotNumber)
      .single();

    if (error || !product) {
      return {
        totalProcessed: 0,
        updated: 0,
        errors: [`Product with lot number ${lotNumber} not found`],
        details: []
      };
    }

    return await syncProductPreviews([product.id]);
  } catch (error) {
    return {
      totalProcessed: 0,
      updated: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      details: []
    };
  }
};

// Найти товары с несоответствующими preview URLs
export const findMismatchedPreviews = async (): Promise<{
  mismatched: Array<{
    id: string;
    lot_number: number;
    title: string;
    preview_image_url: string | null;
    primary_image_url: string | null;
    cloudinary_public_id: string | null;
  }>;
  total: number;
}> => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        lot_number,
        title,
        preview_image_url,
        cloudinary_public_id,
        product_images(url, is_primary)
      `)
      .order('lot_number');

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    const mismatched = products?.filter(product => {
      const primaryImage = product.product_images?.find(img => img.is_primary) || 
                          product.product_images?.[0];
      
      if (!primaryImage) return false;
      
      // Проверяем соответствие preview_image_url и primary image
      if (!product.preview_image_url) return true;
      
      // Извлекаем имя файла из URLs для сравнения
      const previewFileName = product.preview_image_url.split('/').pop()?.split('?')[0];
      const primaryFileName = primaryImage.url.split('/').pop()?.split('?')[0];
      
      return previewFileName !== primaryFileName;
    }).map(product => ({
      id: product.id,
      lot_number: product.lot_number,
      title: product.title,
      preview_image_url: product.preview_image_url,
      primary_image_url: product.product_images?.find(img => img.is_primary)?.url || 
                        product.product_images?.[0]?.url || null,
      cloudinary_public_id: product.cloudinary_public_id
    })) || [];

    return {
      mismatched,
      total: products?.length || 0
    };
  } catch (error) {
    console.error('Error finding mismatched previews:', error);
    return { mismatched: [], total: 0 };
  }
};
