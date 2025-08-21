import React from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Check } from "lucide-react";
import { OrderConfirmImagesDialog } from "@/components/order/OrderConfirmImagesDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OrderConfirmButtonProps {
  orderId: string;
}

export const OrderConfirmButton: React.FC<OrderConfirmButtonProps> = ({ orderId }) => {

  const { data: orderDetails } = useQuery({
    queryKey: ['order-details', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          order_number,
          buyer:profiles!orders_buyer_id_fkey (
            opt_id
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    }
  });

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
        <span>Confirmation photos uploaded</span>
      </div>
    );
  }

  return (
    <OrderConfirmImagesDialog orderId={orderId} />
  );
};
