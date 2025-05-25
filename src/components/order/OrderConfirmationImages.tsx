
import React from 'react';
import { ImageUpload } from "@/components/ui/image-upload";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface OrderConfirmationImagesProps {
  orderId: string;
  canEdit: boolean;
}

export const OrderConfirmationImages = ({ orderId, canEdit }: OrderConfirmationImagesProps) => {
  const queryClient = useQueryClient();

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

      // Invalidate and refetch the query
      queryClient.invalidateQueries({ queryKey: ['confirm-images', orderId] });

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

      // Invalidate and refetch the query
      queryClient.invalidateQueries({ queryKey: ['confirm-images', orderId] });

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
      
      {/* Display existing confirmation images */}
      {images && images.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Загруженные фотографии подтверждения ({images.length}):</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((imageUrl, index) => (
              <div key={imageUrl} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border border-green-200 bg-green-50">
                  <img
                    src={imageUrl}
                    alt={`Confirmation image ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                {canEdit && (
                  <button
                    onClick={() => handleDelete(imageUrl)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Удалить фотографию подтверждения"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {canEdit && (
        <ImageUpload
          images={images || []}
          onUpload={handleUpload}
          onDelete={handleDelete}
          maxImages={5}
          storageBucket="order-images"
          filePrefix="confirm" // Add prefix for confirmation images
        />
      )}
    </div>
  );
};
