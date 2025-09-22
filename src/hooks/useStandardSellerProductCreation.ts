import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUserProfile } from './useCurrentUserProfile';
import { ProductMediaService } from '@/services/ProductMediaService';

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
    console.log('🚀 Starting standard seller product creation');
    
    if (isProfileLoading) {
      throw new Error('Загрузка данных пользователя...');
    }

    if (!currentUserProfile) {
      console.error('❌ No current user profile available');
      throw new Error('Не удалось получить данные пользователя. Попробуйте обновить страницу.');
    }

    console.log('👤 User profile:', currentUserProfile);

    if (currentUserProfile.user_type !== 'seller') {
      throw new Error('Только продавцы могут создавать товары');
    }

    setIsCreating(true);

    try {
      // Step 1: Create product using RPC
      console.log('📦 Creating product with RPC...');
      const { data: productId, error: productError } = await supabase
        .rpc('create_product_with_images', {
          p_title: title.trim(),
          p_price: price,
          p_description: description?.trim() || null
        });

      if (productError) {
        console.error('❌ Error creating product:', productError);
        throw productError;
      }

      console.log('✅ Product created with ID:', productId);

      // Step 2: Add media using ProductMediaService
      try {
        await ProductMediaService.addMediaToProduct({
          productId,
          imageUrls,
          videoUrls: [],
          primaryImage,
          userType: 'seller'
        });
        console.log('✅ Media added successfully');
      } catch (mediaError) {
        console.error('❌ Error adding media:', mediaError);
        // Don't throw here, product was created successfully
        toast({
          title: 'Предупреждение',
          description: 'Товар создан, но возникла ошибка при добавлении изображений',
          variant: 'destructive',
        });
      }

      toast({
        title: 'Товар создан!',
        description: 'Ваш товар успешно опубликован',
      });

      return productId;

    } catch (error) {
      console.error('💥 Error in standard seller product creation:', error);
      
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