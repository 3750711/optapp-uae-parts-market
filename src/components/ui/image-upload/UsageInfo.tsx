
import React from 'react';
import { Cloud, Sparkles } from "lucide-react";

interface UsageInfoProps {
  existingImagesCount: number;
  maxImages: number;
}

export const UsageInfo: React.FC<UsageInfoProps> = ({
  existingImagesCount,
  maxImages
}) => {
  return (
    <div className="text-xs text-gray-500 space-y-1">
      <div>Загружено: {existingImagesCount} / {maxImages} изображений</div>
      <div className="flex items-center gap-1">
        <Cloud className="h-3 w-3 text-blue-500" />
        🎯 Все изображения автоматически сжимаются до ~400KB через Cloudinary
      </div>
      <div className="flex items-center gap-1">
        <Sparkles className="h-3 w-3 text-yellow-500" />
        🖼️ Превью 20KB создается автоматически в формате WebP
      </div>
      <div>💡 Никаких промежуточных загрузок - сразу в Cloudinary с оптимизацией</div>
    </div>
  );
};
