
import React, { useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileOptimizedImageUpload } from "@/components/ui/MobileOptimizedImageUpload";
import { useToast } from "@/hooks/use-toast";

interface StorePhotosTabProps {
  storeId: string;
  canEdit?: boolean;
}

export const StorePhotosTab: React.FC<StorePhotosTabProps> = ({
  storeId,
  canEdit = false
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const { data: storeImages = [] } = useQuery({
    queryKey: ['store-images', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_images')
        .select('url')
        .eq('store_id', storeId)
        .order('created_at');

      if (error) throw error;
      return data?.map(img => img.url) || [];
    }
  });

  const handleImageUpload = async (urls: string[]) => {
    if (!canEdit) return;

    setIsUploading(true);
    try {
      // Save new images to store_images table
      const imageInserts = urls.map(url => ({
        store_id: storeId,
        url
      }));

      const { error } = await supabase
        .from('store_images')
        .insert(imageInserts);

      if (error) throw error;

      toast({
        title: "Успех",
        description: `Загружено ${urls.length} фотографий магазина`,
      });

      // Refetch images
      queryClient.invalidateQueries({ queryKey: ['store-images', storeId] });
    } catch (error) {
      console.error('Error uploading store images:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить фотографии",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDelete = async (url: string) => {
    if (!canEdit) return;

    try {
      const { error } = await supabase
        .from('store_images')
        .delete()
        .eq('store_id', storeId)
        .eq('url', url);

      if (error) throw error;

      toast({
        title: "Успех",
        description: "Фотография удалена",
      });

      // Refetch images
      queryClient.invalidateQueries({ queryKey: ['store-images', storeId] });
    } catch (error) {
      console.error('Error deleting store image:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить фотографию",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">Фотографии магазина</h3>
        <p className="text-sm text-blue-700">
          Добавьте фотографии вашего магазина, чтобы покупатели могли лучше представить ваш бизнес.
          Рекомендуется загружать фото витрины, интерьера и ассортимента.
        </p>
      </div>

      {canEdit ? (
        <MobileOptimizedImageUpload
          onUploadComplete={handleImageUpload}
          maxImages={50}
          existingImages={storeImages}
          onImageDelete={handleImageDelete}
          productId={storeId}
          buttonText="Добавить фотографии магазина"
          showOnlyButton={false}
        />
      ) : (
        <MobileOptimizedImageUpload
          onUploadComplete={() => {}}
          maxImages={50}
          existingImages={storeImages}
          productId={storeId}
          showGalleryOnly={true}
        />
      )}
    </div>
  );
};
