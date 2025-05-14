
import React from "react";
import { Label } from "@/components/ui/label";
import { Video } from "lucide-react";

interface ProductVideosProps {
  videos: string[];
}

const ProductVideos: React.FC<ProductVideosProps> = ({ videos }) => {
  if (!videos || videos.length === 0) return null;
  
  return (
    <div className="mb-8">
      <Label className="text-sm text-gray-500 mb-2 block flex items-center gap-2">
        <Video className="w-4 h-4" />
        Видео товара
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
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductVideos;
