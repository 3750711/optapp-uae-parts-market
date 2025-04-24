
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Check } from "lucide-react";
import { OrderConfirmationImages } from "@/components/order/OrderConfirmationImages";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OrderConfirmButtonProps {
  orderId: string;
}

export const OrderConfirmButton: React.FC<OrderConfirmButtonProps> = ({ orderId }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: images = [] } = useQuery({
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

  if (images.length > 0) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <Check className="h-4 w-4" />
        <span>Фото с подтверждением загружены</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="outline"
        className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 gap-2"
      >
        <Upload className="h-4 w-4" />
        Прикрепить фото с подписью
      </Button>
      
      {isExpanded && (
        <OrderConfirmationImages orderId={orderId} canEdit={true} />
      )}
    </div>
  );
};
