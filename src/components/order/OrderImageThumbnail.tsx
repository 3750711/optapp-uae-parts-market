
import React from 'react';
import { useOrderImage } from '@/hooks/useOrderImage';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderImageThumbnailProps {
  orderId: string;
  className?: string;
}

export const OrderImageThumbnail: React.FC<OrderImageThumbnailProps> = ({ orderId, className }) => {
  const { imageUrl, isLoading } = useOrderImage(orderId);

  const containerClasses = cn("flex items-center justify-center bg-gray-100 rounded-md shrink-0", className);

  if (isLoading) {
    return (
      <div className={containerClasses}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div className={cn("overflow-hidden", containerClasses)}>
        <img
          src={imageUrl}
          alt="Фото заказа"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <ImageIcon className="h-6 w-6 text-gray-400" />
    </div>
  );
};
