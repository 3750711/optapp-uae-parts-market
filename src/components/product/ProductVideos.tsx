
import React from "react";
import { Label } from "@/components/ui/label";
import { Video } from "lucide-react";
import { BunnyVideoPlayer } from "@/components/ui/bunny-video-player";

interface ProductVideosProps {
  videos: string[];
}

const ProductVideos: React.FC<ProductVideosProps> = ({ videos }) => {
  if (!videos || videos.length === 0) return null;
  
  const isBunnyNetUrl = (url: string): boolean => {
    return url.includes("b-cdn.net") || url.includes("bunnycdn.com");
  };
  
  const extractVideoId = (url: string): string => {
    // Извлекаем ID видео из URL bunny.net
    // Пример URL: https://video-example.b-cdn.net/12345/play_720p.mp4
    if (isBunnyNetUrl(url)) {
      const parts = url.split('/');
      return parts[3] || ''; // Возвращаем ID видео или пустую строку
    }
    return '';
  };

  return (
    <div className="mb-8">
      <Label className="text-sm text-gray-500 mb-2 block flex items-center gap-2">
        <Video className="w-4 h-4" />
        Видео товара
      </Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map((url, idx) => {
          // Проверяем, является ли URL ссылкой на bunny.net
          if (isBunnyNetUrl(url)) {
            const videoId = extractVideoId(url);
            return (
              <div key={url} className="relative aspect-video rounded-lg overflow-hidden border bg-black">
                <BunnyVideoPlayer 
                  videoId={videoId}
                  className="w-full h-full"
                />
              </div>
            );
          }
          
          // Если это обычное видео (например, из Supabase), используем стандартный плеер
          return (
            <div key={url} className="relative aspect-video rounded-lg overflow-hidden border bg-black">
              <video 
                src={url} 
                controls 
                className="w-full h-full object-cover"
                preload="metadata"
                controlsList="nodownload"
                disablePictureInPicture
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductVideos;
