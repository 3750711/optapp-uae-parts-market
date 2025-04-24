
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Check } from "lucide-react";
import { OrderConfirmationImages } from "@/components/order/OrderConfirmationImages";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OrderConfirmButtonProps {
  orderId: string;
}

export const OrderConfirmButton: React.FC<OrderConfirmButtonProps> = ({ orderId }) => {
  const [isOpen, setIsOpen] = useState(false);

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
        <span>Фото с подтверждением загружены</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 gap-2"
      >
        <Upload className="h-4 w-4" />
        Прикрепить фото с подписью
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Загрузка фотографий подтверждения</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="font-medium text-yellow-800">
                Напишите на проданном товаре номер заказа и ID покупателя
              </p>
              {orderDetails && (
                <div className="mt-2 space-y-1 text-sm">
                  <p><span className="font-medium">Номер заказа:</span> {orderDetails.order_number}</p>
                  <p><span className="font-medium">OPT_ID покупателя:</span> {orderDetails.buyer?.opt_id || 'Не указан'}</p>
                </div>
              )}
            </div>

            <OrderConfirmationImages orderId={orderId} canEdit={true} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
