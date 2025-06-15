
import React from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileOptimizedImageUpload } from "@/components/ui/MobileOptimizedImageUpload";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

interface OrderConfirmationImagesProps {
  orderId: string;
  canEdit?: boolean;
}

export const OrderConfirmationImages: React.FC<OrderConfirmationImagesProps> = ({
  orderId,
  canEdit = false
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: images = [], isLoading, isError } = useQuery({
    queryKey: ['confirm-images', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url, created_at')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data?.map(img => img.url) || [];
    }
  });

  const handleImageUpload = async (urls: string[]) => {
    if (!canEdit) return;

    try {
      const imageInserts = urls.map(url => ({
        order_id: orderId,
        url
      }));

      const { error } = await supabase
        .from('confirm_images')
        .insert(imageInserts);

      if (error) throw error;

      toast({
        title: "Успех",
        description: `Загружено ${urls.length} подтверждающих фотографий`,
      });

      queryClient.invalidateQueries({ queryKey: ['confirm-images', orderId] });
    } catch (error) {
      console.error('Error saving confirmation image URLs:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить URL фотографий",
        variant: "destructive",
      });
    }
  };

  const handleImageDelete = async (url: string) => {
    if (!canEdit) return;

    try {
      const { error } = await supabase
        .from('confirm_images')
        .delete()
        .eq('order_id', orderId)
        .eq('url', url);

      if (error) throw error;

      toast({
        title: "Успех",
        description: "Фотография удалена",
      });

      queryClient.invalidateQueries({ queryKey: ['confirm-images', orderId] });
    } catch (error) {
      console.error('Error deleting confirmation image:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить фотографию",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-4 text-destructive bg-destructive/10 rounded-md">
        Ошибка загрузки фотографий. Попробуйте обновить.
      </div>
    );
  }

  if (!canEdit && images.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground min-h-[200px] flex items-center justify-center">
        Подтверждающие фотографии не загружены.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <MobileOptimizedImageUpload
        existingImages={images}
        onUploadComplete={handleImageUpload}
        onImageDelete={canEdit ? handleImageDelete : undefined}
        maxImages={20}
        productId={orderId}
        disabled={!canEdit}
        buttonText="Загрузить фото подтверждения"
        disableToast={true}
      />
    </div>
  );
};
