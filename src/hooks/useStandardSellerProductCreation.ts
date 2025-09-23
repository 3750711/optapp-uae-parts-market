import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUserProfile } from './useCurrentUserProfile';
import { ProductMediaService } from '@/services/ProductMediaService';
import { logger } from '@/utils/logger';

interface CreateStandardProductParams {
  title: string;
  price: number;
  description?: string;
  imageUrls: string[];
  primaryImage: string;
}

export const useStandardSellerProductCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { data: currentUserProfile, isLoading: isProfileLoading } = useCurrentUserProfile();

  const createStandardSellerProduct = async ({
    title,
    price,
    description,
    imageUrls,
    primaryImage
  }: CreateStandardProductParams) => {
    logger.log('🚀 Starting standard seller product creation');
    
    if (isProfileLoading) {
      throw new Error('Загрузка данных пользователя...');
    }

    if (!currentUserProfile) {
      logger.error('❌ No current user profile available');
      throw new Error('Не удалось получить данные пользователя. Попробуйте обновить страницу.');
    }

    logger.log('👤 User profile:', currentUserProfile);

    if (currentUserProfile.user_type !== 'seller') {
      throw new Error('Только продавцы могут создавать товары');
    }

    setIsCreating(true);

    try {
      // Step 1: Create product using new RPC function for standard sellers
      logger.log('📦 Creating product with create_standard_product RPC...');
      const { data: productId, error: productError } = await supabase
        .rpc('create_standard_product', {
          p_title: title.trim(),
          p_price: price,
          p_description: description?.trim() || null
        });

      if (productError) {
        logger.error('❌ Error creating product:', productError);
        throw productError;
      }

      logger.log('✅ Product created with ID:', productId);

      // Step 2: Add media using ProductMediaService
      try {
        await ProductMediaService.addMediaToProduct({
          productId,
          imageUrls,
          videoUrls: [],
          primaryImage,
          userType: 'seller'
        });
        logger.log('✅ Media added successfully');
      } catch (mediaError) {
        logger.error('❌ Error adding media, rolling back product:', mediaError);
        
        // Rollback: Delete the created product since media failed
        try {
          const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);
            
          if (deleteError) {
            logger.error('❌ Failed to rollback product:', deleteError);
          } else {
            logger.log('🔄 Product rolled back successfully');
          }
        } catch (rollbackError) {
          logger.error('❌ Rollback failed:', rollbackError);
        }
        
        // Re-throw media error to fail the entire operation
        throw new Error('Не удалось загрузить изображения. Товар не был создан.');
      }

      toast({
        title: 'Товар создан!',
        description: 'Ваш товар успешно опубликован',
      });

      return productId;

    } catch (error) {
      logger.error('💥 Error in standard seller product creation:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка при создании товара';
      
      toast({
        title: 'Ошибка создания товара',
        description: errorMessage,
        variant: 'destructive',
      });

      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createStandardSellerProduct,
    isCreating,
    currentUserProfile,
    isProfileLoading
  };
};