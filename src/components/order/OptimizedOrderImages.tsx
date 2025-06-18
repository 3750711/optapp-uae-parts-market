
import React from 'react';
import { Card } from '@/components/ui/card';

interface OptimizedOrderImagesProps {
  images: string[];
  className?: string;
}

export const OptimizedOrderImages: React.FC<OptimizedOrderImagesProps> = ({
  images,
  className = ""
}) => {
  if (!images || images.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        Изображения не добавлены
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 ${className}`}>
      {images.map((image, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="aspect-square relative">
            <img
              src={image}
              alt={`Изображение ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </Card>
      ))}
    </div>
  );
};

export default OptimizedOrderImages;
