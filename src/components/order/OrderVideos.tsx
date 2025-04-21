
import React from "react";
import { Label } from "@/components/ui/label";
import { Film } from "lucide-react";

interface OrderVideosProps {
  videos: string[];
}

export const OrderVideos: React.FC<OrderVideosProps> = ({ videos }) => {
  if (!videos || videos.length === 0) return null;
  return (
    <div>
      <Label className="text-sm text-gray-500 mb-2 block flex items-center gap-2">
        <Film className="w-4 h-4" />
        Видео заказа
      </Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map((url, idx) => (
          <div key={url} className="relative aspect-video rounded-lg overflow-hidden border">
            <video src={url} controls className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
};
