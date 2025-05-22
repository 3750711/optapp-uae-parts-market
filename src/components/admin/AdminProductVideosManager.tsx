
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import VideoUpload from "@/components/ui/video-upload";

interface AdminProductVideosManagerProps {
  productId: string;
  videos: string[];
  onVideosChange: (videos: string[]) => void;
}

export const AdminProductVideosManager: React.FC<AdminProductVideosManagerProps> = ({
  productId,
  videos,
  onVideosChange,
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleVideoUpload = async (newUrls: string[]) => {
    try {
      setIsUploading(true);
      
      const videoInserts = newUrls.map(url => ({
        product_id: productId,
        url
      }));

      const { error } = await supabase
        .from('product_videos')
        .insert(videoInserts);
        
      if (error) throw error;
      
      onVideosChange([...videos, ...newUrls]);
      
      toast({
        title: "Видео добавлены",
        description: `Добавлено ${newUrls.length} видео`,
      });
    } catch (error) {
      console.error("Error uploading videos:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить видео",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoDelete = async (urlToDelete: string) => {
    try {
      const { error } = await supabase
        .from('product_videos')
        .delete()
        .eq('product_id', productId)
        .eq('url', urlToDelete);
        
      if (error) throw error;
      
      onVideosChange(videos.filter(url => url !== urlToDelete));
      
      toast({
        title: "Видео удалено",
        description: "Видео успешно удалено",
      });
    } catch (error) {
      console.error("Error deleting video:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить видео",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Видео</h3>
      <VideoUpload
        videos={videos}
        onUpload={handleVideoUpload}
        onDelete={handleVideoDelete}
        maxVideos={3}
        storageBucket="Product Images"
        storagePrefix={`product-${productId}/`}
      />
    </div>
  );
};
