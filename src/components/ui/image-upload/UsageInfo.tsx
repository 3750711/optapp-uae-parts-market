
import React from 'react';

interface UsageInfoProps {
  existingImagesCount: number;
  maxImages: number;
}

export const UsageInfo: React.FC<UsageInfoProps> = ({
  existingImagesCount,
  maxImages
}) => {
  return (
    <div className="text-xs text-gray-500">
      <div>Загружено: {existingImagesCount} / {maxImages} изображений</div>
      <div>💡 Все изображения автоматически оптимизируются через Cloudinary</div>
    </div>
  );
};
