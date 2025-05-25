
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, Camera } from "lucide-react";

interface OrderConfirmationImagesDisplayProps {
  orderId: string;
}

export const OrderConfirmationImagesDisplay = ({ orderId }: OrderConfirmationImagesDisplayProps) => {
  const { data: images, isLoading } = useQuery({
    queryKey: ['confirm-images', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', orderId);

      if (error) throw error;
      return data?.map(img => img.url) || [];
    }
  });

  if (isLoading || !images || images.length === 0) {
    return null;
  }

  return (
    <div className="border-t pt-3 mt-3">
      <div className="flex items-center gap-2 mb-2">
        <Check className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium text-green-600">
          Фотографии подтверждения ({images.length})
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {images.slice(0, 3).map((imageUrl, index) => (
          <div key={imageUrl} className="relative aspect-square">
            <img
              src={imageUrl}
              alt={`Confirmation ${index + 1}`}
              className="w-full h-full object-cover rounded-md border border-green-200"
              loading="lazy"
            />
            {index === 2 && images.length > 3 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  +{images.length - 3}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
