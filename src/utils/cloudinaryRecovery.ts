
import { supabase } from "@/integrations/supabase/client";
import { uploadDirectToCloudinary } from "./cloudinaryUpload";
import { getCompressedImageUrl } from "./cloudinaryUtils";

interface RecoveryResult {
  success: boolean;
  updatedProducts: number;
  errors: string[];
}

// Функция для восстановления Cloudinary данных для товаров
export const recoverCloudinaryData = async (productId?: string): Promise<RecoveryResult> => {
  const result: RecoveryResult = {
    success: false,
    updatedProducts: 0,
    errors: []
  };

  try {
    console.log('🔄 Starting Cloudinary data recovery...', { productId });

    // Получаем товары без Cloudinary данных
    let query = supabase
      .from('products')
      .select(`
        id, 
        title,
        product_images!inner(url, is_primary)
      `)
      .is('cloudinary_public_id', null);

    if (productId) {
      query = query.eq('id', productId);
    }

    const { data: products, error: fetchError } = await query.limit(10);

    if (fetchError) {
      result.errors.push(`Ошибка получения товаров: ${fetchError.message}`);
      return result;
    }

    if (!products || products.length === 0) {
      console.log('✅ Все товары уже имеют Cloudinary данные');
      result.success = true;
      return result;
    }

    console.log(`🔍 Найдено ${products.length} товаров без Cloudinary данных`);

    // Обрабатываем каждый товар
    for (const product of products) {
      try {
        console.log(`🔧 Восстанавливаем данные для товара ${product.id}`);

        // Находим основное изображение
        const primaryImage = product.product_images.find(img => img.is_primary);
        const imageUrl = primaryImage?.url || product.product_images[0]?.url;

        if (!imageUrl) {
          result.errors.push(`Товар ${product.id}: нет изображений для обработки`);
          continue;
        }

        // Если изображение уже из Cloudinary, извлекаем public_id
        if (imageUrl.includes('res.cloudinary.com')) {
          const publicIdMatch = imageUrl.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|webp)$/);
          if (publicIdMatch) {
            const publicId = publicIdMatch[1];
            const compressedUrl = getCompressedImageUrl(publicId);

            console.log(`📸 Восстанавливаем из существующего Cloudinary URL:`, {
              productId: product.id,
              publicId,
              compressedUrl
            });

            // Обновляем товар с Cloudinary данными
            const { error: updateError } = await supabase
              .from('products')
              .update({
                cloudinary_public_id: publicId,
                cloudinary_url: compressedUrl,
                preview_image_url: compressedUrl
              })
              .eq('id', product.id);

            if (updateError) {
              result.errors.push(`Товар ${product.id}: ошибка обновления - ${updateError.message}`);
            } else {
              result.updatedProducts++;
              console.log(`✅ Товар ${product.id} успешно восстановлен`);
            }
          } else {
            result.errors.push(`Товар ${product.id}: не удалось извлечь public_id из URL`);
          }
        } else {
          // Если это blob URL или локальный файл, пытаемся загрузить в Cloudinary
          console.log(`🆙 Попытка загрузки в Cloudinary для товара ${product.id}`);
          
          try {
            // Получаем файл из URL (если это blob)
            if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
              const response = await fetch(imageUrl);
              const blob = await response.blob();
              const file = new File([blob], `recovery_${product.id}.jpg`, { type: 'image/jpeg' });

              const uploadResult = await uploadDirectToCloudinary(file, product.id);

              if (uploadResult.success && uploadResult.cloudinaryUrl && uploadResult.publicId) {
                const compressedUrl = getCompressedImageUrl(uploadResult.publicId);

                const { error: updateError } = await supabase
                  .from('products')
                  .update({
                    cloudinary_public_id: uploadResult.publicId,
                    cloudinary_url: compressedUrl,
                    preview_image_url: compressedUrl
                  })
                  .eq('id', product.id);

                if (updateError) {
                  result.errors.push(`Товар ${product.id}: ошибка обновления после загрузки - ${updateError.message}`);
                } else {
                  result.updatedProducts++;
                  console.log(`✅ Товар ${product.id} успешно загружен и восстановлен`);
                }
              } else {
                result.errors.push(`Товар ${product.id}: ошибка загрузки в Cloudinary - ${uploadResult.error}`);
              }
            } else {
              result.errors.push(`Товар ${product.id}: неподдерживаемый тип URL - ${imageUrl}`);
            }
          } catch (uploadError) {
            result.errors.push(`Товар ${product.id}: исключение при загрузке - ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
          }
        }
      } catch (productError) {
        result.errors.push(`Товар ${product.id}: общая ошибка - ${productError instanceof Error ? productError.message : 'Unknown error'}`);
      }
    }

    result.success = result.updatedProducts > 0 || result.errors.length === 0;
    
    console.log('🏁 Cloudinary recovery completed:', {
      success: result.success,
      updatedProducts: result.updatedProducts,
      errorCount: result.errors.length
    });

  } catch (error) {
    console.error('💥 Recovery process failed:', error);
    result.errors.push(`Общая ошибка восстановления: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
};

// Функция для проверки целостности данных товара
export const validateProductIntegrity = async (productId: string): Promise<{
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}> => {
  const issues: string[] = [];
  const suggestions: string[] = [];

  try {
    // Получаем товар с изображениями
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id,
        title,
        cloudinary_public_id,
        cloudinary_url,
        preview_image_url,
        product_images(url, is_primary)
      `)
      .eq('id', productId)
      .single();

    if (error) {
      issues.push(`Ошибка получения товара: ${error.message}`);
      return { isValid: false, issues, suggestions };
    }

    if (!product) {
      issues.push('Товар не найден');
      return { isValid: false, issues, suggestions };
    }

    // Проверяем наличие изображений
    if (!product.product_images || product.product_images.length === 0) {
      issues.push('У товара нет изображений');
      suggestions.push('Добавьте хотя бы одно изображение к товару');
    }

    // Проверяем основное изображение
    const hasPrimaryImage = product.product_images?.some(img => img.is_primary);
    if (!hasPrimaryImage && product.product_images?.length > 0) {
      issues.push('Не указано основное изображение');
      suggestions.push('Установите одно из изображений как основное');
    }

    // Проверяем Cloudinary данные
    if (!product.cloudinary_public_id) {
      issues.push('Отсутствует Cloudinary public_id');
      suggestions.push('Запустите процесс восстановления Cloudinary данных');
    }

    if (!product.cloudinary_url) {
      issues.push('Отсутствует Cloudinary URL');
      suggestions.push('Запустите процесс восстановления Cloudinary данных');
    }

    if (!product.preview_image_url) {
      issues.push('Отсутствует preview image URL');
      suggestions.push('Запустите процесс восстановления Cloudinary данных');
    }

    console.log(`🔍 Проверка целостности товара ${productId}:`, {
      hasImages: product.product_images?.length > 0,
      hasPrimaryImage,
      hasCloudinaryData: !!product.cloudinary_public_id,
      issuesCount: issues.length
    });

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };

  } catch (error) {
    issues.push(`Ошибка валидации: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { isValid: false, issues, suggestions };
  }
};
