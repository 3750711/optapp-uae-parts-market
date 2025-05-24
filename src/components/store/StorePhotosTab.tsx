
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface StoreImage {
  id: string;
  url: string;
  is_primary?: boolean;
}

interface StorePhotosTabProps {
  storeImages?: StoreImage[];
  storeName: string;
}

const StorePhotosTab: React.FC<StorePhotosTabProps> = ({
  storeImages,
  storeName
}) => {
  if (!storeImages || storeImages.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">У этого магазина пока нет фотографий</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {storeImages.map((image) => (
        <div key={image.id} className="aspect-square overflow-hidden rounded-lg">
          <OptimizedImage 
            src={image.url} 
            alt={storeName} 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      ))}
    </div>
  );
};

export default StorePhotosTab;
