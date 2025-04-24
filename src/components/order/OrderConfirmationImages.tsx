
import React from 'react';
import { ImageUpload } from "@/components/ui/image-upload";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface OrderConfirmationImagesProps {
  orderId: string;
  canEdit: boolean;
}

export const OrderConfirmationImages = ({ orderId, canEdit }: OrderConfirmationImagesProps) => {
  const { data: images, isLoading } = useQuery({
    queryKey: ['confirm-images', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', orderId);

      if (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить фотографии подтверждения",
          variant: "destructive",
        });
        throw error;
      }

      return data?.map(img => img.url) || [];
    }
  });

  const handleUpload = async (urls: string[]) => {
    try {
      const { error } = await supabase
        .from('confirm_images')
        .insert(
          urls.map(url => ({
            order_id: orderId,
            url
          }))
        );

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Фотографии подтверждения загружены",
      });
    } catch (error) {
      console.error('Error uploading confirmation images:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить фотографии",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (url: string) => {
    try {
      const { error } = await supabase
        .from('confirm_images')
        .delete()
        .eq('url', url)
        .eq('order_id', orderId);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Фотография удалена",
      });
    } catch (error) {
      console.error('Error deleting confirmation image:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить фотографию",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return null;

  return (
    <div className="space-y-4">
      <div className="font-medium text-lg">Фотографии подтверждения</div>
      <ImageUpload
        images={images || []}
        onUpload={handleUpload}
        onDelete={handleDelete}
        maxImages={5}
      />
    </div>
  );
};
