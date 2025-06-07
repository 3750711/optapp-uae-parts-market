
import React from 'react';
import { Label } from "@/components/ui/label";

interface OrderImagesProps {
  images: string[];
}

export const OrderImages: React.FC<OrderImagesProps> = ({ images }) => {
  if (images.length === 0) return null;

  return (
    <div>
      <Label className="text-sm text-gray-500 mb-2 block">Фотографии заказа</Label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((url, index) => (
          <div key={url} className="relative aspect-square">
            <img
              src={url}
              alt={`Order image ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
