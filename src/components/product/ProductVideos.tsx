
import React from "react";
import { Label } from "@/components/ui/label";
import { Video, Film } from "lucide-react";

interface ProductVideosProps {
  videos: string[];
}

const ProductVideos: React.FC<ProductVideosProps> = ({ videos }) => {
  if (!videos || videos.length === 0) return null;
  
  return (
    <div className="mb-8">
      <Label className="text-sm text-gray-500 mb-2 block flex items-center gap-2">
        <Video className="w-4 h-4" />
        Видео товара ({videos.length})
      </Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map((url, idx) => (
          <div key={url} className="relative aspect-video rounded-lg overflow-hidden border bg-black">
            <video 
              src={url} 
              controls 
              className="w-full h-full object-cover"
              preload="metadata"
              controlsList="nodownload"
              disablePictureInPicture
              poster={`${url.replace(/\.[^/.]+$/, '')}.jpg`} // Пытаемся загрузить превью от Cloudinary
            />
            <div className="absolute top-2 left-2 bg-black bg-opacity-70 rounded px-2 py-1 text-white text-xs flex items-center gap-1">
              <Film className="w-3 h-3" />
              HD
            </div>
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 rounded px-2 py-1 text-white text-xs">
              Видео {idx + 1}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Видео оптимизированы для быстрой загрузки через Cloudinary CDN
      </p>
    </div>
  );
};

export default ProductVideos;
