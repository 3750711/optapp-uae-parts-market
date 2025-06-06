
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { extractPublicIdFromUrl, getPreviewImageUrl } from '@/utils/cloudinaryUtils';
import { useToast } from '@/hooks/use-toast';

interface UsePreviewImageSyncProps {
  productId: string;
  onSyncComplete?: (previewUrl: string) => void;
}

export const usePreviewImageSync = ({ 
  productId, 
  onSyncComplete 
}: UsePreviewImageSyncProps) => {
  const { toast } = useToast();

  const syncPreviewImage = useCallback(async (primaryImageUrl: string) => {
    if (!primaryImageUrl || !productId) {
      console.warn('Missing primaryImageUrl or productId for preview sync');
      return;
    }

    try {
      console.log('🔄 Syncing preview for product:', productId, 'with image:', primaryImageUrl);
      
      // Extract Cloudinary public_id from the primary image URL
      const publicId = extractPublicIdFromUrl(primaryImageUrl);
      
      if (!publicId) {
        console.warn('⚠️ Could not extract Cloudinary public_id from URL:', primaryImageUrl);
        return;
      }

      // Generate new preview URL using Cloudinary transformations
      const newPreviewUrl = getPreviewImageUrl(publicId);
      
      console.log('🎨 Generated new preview URL:', newPreviewUrl);

      // Update the product's preview_image_url in the database
      const { error } = await supabase
        .from('products')
        .update({ 
          preview_image_url: newPreviewUrl,
          cloudinary_public_id: publicId,
          cloudinary_url: primaryImageUrl
        })
        .eq('id', productId);

      if (error) {
        throw error;
      }

      console.log('✅ Preview URL updated successfully for product:', productId);
      
      // Call completion callback if provided
      onSyncComplete?.(newPreviewUrl);

    } catch (error) {
      console.error('❌ Error syncing preview image:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить превью изображения",
        variant: "destructive",
      });
    }
  }, [productId, onSyncComplete, toast]);

  return { syncPreviewImage };
};
