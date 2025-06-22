
import React from "react";
import { Label } from "@/components/ui/label";
import { Film } from "lucide-react";
import { CloudinaryVideoUpload } from "@/components/ui/cloudinary-video-upload";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface OrderVideosProps {
  videos: string[];
  orderId?: string;
}

export const OrderVideos: React.FC<OrderVideosProps> = ({ videos, orderId }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Проверяем, является ли пользователь администратором
  const isAdmin = profile?.user_type === 'admin';

  const handleVideoUpload = async (newUrls: string[]) => {
    if (!orderId || !isAdmin) return;

    try {
      console.log('🎬 Adding videos to order:', { orderId, newUrls });
      
      const videoInserts = newUrls.map(url => ({
        order_id: orderId,
        url
      }));

      const { error } = await supabase
        .from('order_videos')
        .insert(videoInserts);
        
      if (error) throw error;
      
      toast({
        title: "Видео добавлены",
        description: `Добавлено ${newUrls.length} видео через Cloudinary`,
      });

      // Обновляем данные заказа
      queryClient.invalidateQueries({ queryKey: ['order-videos', orderId] });
    } catch (error) {
      console.error("Error uploading videos:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить видео",
        variant: "destructive",
      });
    }
  };

  const handleVideoDelete = async (urlToDelete: string) => {
    if (!orderId || !isAdmin) return;

    try {
      const { error } = await supabase
        .from('order_videos')
        .delete()
        .eq('order_id', orderId)
        .eq('url', urlToDelete);
        
      if (error) throw error;
      
      toast({
        title: "Видео удалено",
        description: "Видео успешно удалено",
      });

      // Обновляем данные заказа
      queryClient.invalidateQueries({ queryKey: ['order-videos', orderId] });
    } catch (error) {
      console.error("Error deleting video:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить видео",
        variant: "destructive",
      });
    }
  };

  if (!videos || videos.length === 0) {
    // Если видео нет, но пользователь админ и есть orderId - показываем загрузку
    if (isAdmin && orderId) {
      return (
        <div>
          <Label className="text-sm text-gray-500 mb-2 block flex items-center gap-2">
            <Film className="w-4 h-4" />
            Видео заказа
          </Label>
          <CloudinaryVideoUpload
            videos={[]}
            onUpload={handleVideoUpload}
            onDelete={handleVideoDelete}
            maxVideos={3}
            productId={orderId}
            buttonText="Загрузить видео для заказа"
          />
        </div>
      );
    }
    return null;
  }

  return (
    <div>
      <Label className="text-sm text-gray-500 mb-2 block flex items-center gap-2">
        <Film className="w-4 h-4" />
        Видео заказа ({videos.length})
      </Label>
      
      {isAdmin && orderId ? (
        <CloudinaryVideoUpload
          videos={videos}
          onUpload={handleVideoUpload}
          onDelete={handleVideoDelete}
          maxVideos={3}
          productId={orderId}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((url, idx) => (
            <div key={url} className="relative aspect-video rounded-lg overflow-hidden border">
              <video src={url} controls className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-black bg-opacity-70 rounded px-2 py-1 text-white text-xs flex items-center gap-1">
                <Film className="w-3 h-3" />
                Cloudinary
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
